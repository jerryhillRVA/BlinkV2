import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { ToastService } from '../../../../core/toast/toast.service';
import { ContentStateService } from '../../content-state.service';
import {
  CTA_TEXT_MAX_CHARS,
  DESCRIPTION_MAX_CHARS,
  DESCRIPTION_MIN_CHARS,
  KEY_MESSAGE_MAX_CHARS,
  MAX_PILLARS_PER_ITEM,
} from '../../content.constants';
import type {
  ContentItem,
  ContentObjective,
  ContentStatus,
  CtaType,
  TonePreset,
} from '../../content.types';
import type {
  ApprovalEntryContract,
  ApprovalStatusContract,
  DraftCarouselSlideContract,
  DraftSequenceBlockContract,
  DraftShotItemContract,
  DraftUploadedAssetContract,
  PackagingFacebookContract,
  PackagingInstagramContract,
  PackagingLinkedInContract,
  PackagingTikTokContract,
  PackagingXContract,
  PackagingYouTubeContract,
  PlatformContract,
  PrimaryCtaContract,
  ProductionBriefContract,
  ProductionDraftCarouselContract,
  ProductionDraftContract,
  ProductionDraftImageSingleContract,
  ProductionDraftTextContract,
  ProductionDraftVideoContract,
  ProductionDraftVideoLongContract,
  ProductionPackagingContract,
  ProductionQAContract,
  PublishConfigContract,
  PublishingModeContract,
} from '@blinksocial/contracts';
import { generateId, toggleArrayItem } from '../../content.utils';
import type {
  BriefValidationIssue,
  ProductionStep,
} from './post-detail.types';

/**
 * Scoped per PostDetailComponent. Mirrors ConceptDetailStore: all writes go
 * through persist() so the brief-approved write-lock lives in one place.
 */
@Injectable()
export class PostDetailStore {
  private readonly state = inject(ContentStateService);
  private readonly toast = inject(ToastService);
  /* v8 ignore next 1 — V8's function-call-throws branches on input()/signal() declarations are unreachable (Angular class-field init time; ESM exports not spy-able) */
  private readonly _itemId = signal<string | null>(null);

  readonly item = computed<ContentItem | null>(
    () => this.state.items().find((i) => i.id === this._itemId()) ?? null,
  );
  readonly pillars = this.state.pillars;
  readonly segments = this.state.segments;

  /**
   * Ticket #118: count of live (non-archived) sibling posts under the same
   * parent concept, including the current post itself. Drives the count in
   * the "Send back to Concept" confirm copy.
   */
  readonly liveSiblingPostCount = computed<number>(() => {
    const conceptId = this.item()?.conceptId;
    if (!conceptId) return 0;
    return this.state
      .items()
      .filter(
        (i) =>
          i.stage === 'post' && i.conceptId === conceptId && !i.archived,
      ).length;
  });
  /* v8 ignore next 1 — V8's function-call-throws branches on input()/signal() declarations are unreachable (Angular class-field init time; ESM exports not spy-able) */
  readonly activeStep = signal<ProductionStep>('brief');

  /**
   * Tracks whether we've resolved the landing step for the currently-set
   * itemId. The full item arrives asynchronously (loadFullItem fetches it
   * after the route fires), so we can't derive the landing step inside
   * setItemId synchronously. The constructor effect below watches for the
   * item to resolve and sets activeStep ONCE per item-id transition;
   * subsequent navigation (user-driven setActiveStep) is preserved.
   */
  private lastLandingResolvedFor: string | null = null;

  constructor() {
    effect(() => {
      const id = this._itemId();
      const item = this.item();
      if (
        id &&
        item?.id === id &&
        this.isFullyLoaded(item) &&
        this.lastLandingResolvedFor !== id
      ) {
        this.lastLandingResolvedFor = id;
        this.activeStep.set(this.deriveInitialStep(item));
      }
    });
  }

  setItemId(id: string | null): void {
    this._itemId.set(id);
    this.lastLandingResolvedFor = null;
    // Synchronous resolution path: if the FULL item (not just a lite index
    // projection) is already in state at call-time, resolve the landing
    // step now. Otherwise set a tentative 'brief' and let the constructor
    // effect fire once loadFullItem completes and `isFullyLoaded` flips
    // true. Lite entries from the pipeline-view index lack briefApproved
    // and production, so resolving against them would incorrectly lock in
    // 'brief' before the full data arrives.
    const item = id
      ? this.state.items().find((i) => i.id === id) ?? null
      : null;
    if (item && this.isFullyLoaded(item)) {
      this.lastLandingResolvedFor = id;
      this.activeStep.set(this.deriveInitialStep(item));
    } else {
      this.activeStep.set('brief');
    }
  }

  /**
   * Heuristic: a "full" item has either an explicit briefApproved flag or
   * a production block. Lite entries from the content index have neither.
   * Brand-new posts that genuinely lack both fall through to the tentative
   * 'brief' default — which is the right landing anyway.
   */
  private isFullyLoaded(item: ContentItem): boolean {
    return item.briefApproved !== undefined || !!item.production;
  }

  /** Pure UI navigation between steps — does not persist productionStep. */
  setActiveStep(step: ProductionStep): void {
    this.activeStep.set(step);
  }

  /**
   * Advance the post forward to a new step AND persist `production.productionStep`.
   * Use this from Continue buttons (Brief → Draft, Draft → Packaging, etc.) so
   * the next visit lands the user on the latest step. Persistence flows through
   * the existing opaque-JSON path that AgenticFilesystem will service in
   * production — no contract changes needed at swap-time.
   *
   * Pipeline-lane sync (#129): advancing into `'qa'` from `status: 'in-progress'`
   * also flips top-level `status` to `'review'` so the post moves from the
   * Post Builder swim lane into Scheduled on the pipeline board (column id
   * is still `'review'`; label was renamed in #141). The flip is conditional
   * on the current status being `'in-progress'` to avoid downgrading posts
   * that have already reached `'scheduled'` or `'published'`.
   */
  advanceProductionStep(step: ProductionStep): void {
    this.activeStep.set(step);
    const item = this.item();
    if (!item) return;
    const shouldPromoteToReview = step === 'qa' && item.status === 'in-progress';
    const next: ContentItem = {
      ...item,
      ...(shouldPromoteToReview ? { status: 'review' as ContentStatus } : {}),
      production: { ...item.production, productionStep: step },
      updatedAt: new Date().toISOString(),
    };
    this.state.saveItem(next);
  }

  /**
   * Resolve the right landing step for a post.
   *
   * Order of preference:
   *   1. If the brief is NOT yet approved, always land on Brief.
   *   2. Otherwise, if `production.productionStep` was previously persisted
   *      and matches one of our four UI steps, use that.
   *   3. Otherwise (brief approved but no explicit step persisted yet),
   *      land on Draft — the brief is done, so Draft is the next-up work.
   */
  private deriveInitialStep(item: ContentItem): ProductionStep {
    if (!item.briefApproved) return 'brief';
    const persisted = item.production?.productionStep;
    if (
      persisted === 'brief' ||
      persisted === 'draft' ||
      persisted === 'packaging' ||
      persisted === 'qa'
    ) {
      return persisted;
    }
    return 'draft';
  }

  // ── field mutations ─────────────────────────────────────────────────
  updateTitle(title: string): void {
    const trimmed = title.trim();
    if (!trimmed) return;
    this.persist({ title: trimmed });
  }

  updateDescription(description: string): void {
    this.persist({ description });
  }

  setStatus(status: ContentStatus): void {
    this.persist({ status });
  }

  setOwner(ownerId: string): void {
    this.persist({ owner: ownerId.trim() || null });
  }

  setObjective(v: ContentObjective | ''): void {
    this.persist({ objective: v === '' ? undefined : v });
  }

  setTonePreset(v: TonePreset | ''): void {
    this.persist({ tonePreset: v === '' ? undefined : v });
  }

  setKeyMessage(v: string): void {
    // Cap to max but DO persist an empty string when the user clears the
    // field — `keyMessage: undefined` would be dropped by JSON.stringify
    // on the PUT body and the mock API would merge the old value back in,
    // making the field's text "reappear" after a delete + space + delete.
    const capped = v.slice(0, KEY_MESSAGE_MAX_CHARS);
    this.persist({ keyMessage: capped });
  }

  togglePillar(id: string): void {
    const item = this.item();
    if (!item) return;
    const current = item.pillarIds;
    const already = current.includes(id);
    if (!already && current.length >= MAX_PILLARS_PER_ITEM) return;
    this.persist({ pillarIds: toggleArrayItem(current, id) });
  }

  toggleSegment(id: string): void {
    const item = this.item();
    if (!item) return;
    this.persist({ segmentIds: toggleArrayItem(item.segmentIds, id) });
  }

  setCtaType(v: CtaType | ''): void {
    if (v === '') {
      this.persist({ cta: undefined });
      return;
    }
    const existing = this.item()?.cta;
    this.persist({ cta: { type: v, text: existing?.text ?? '' } });
  }

  setCtaText(v: string): void {
    const item = this.item();
    if (!item?.cta) return;
    const trimmed = v.slice(0, CTA_TEXT_MAX_CHARS);
    this.persist({ cta: { type: item.cta.type, text: trimmed } });
  }

  // ── brief sub-field setters (production.brief) ─────────────────────
  readonly brief = computed<ProductionBriefContract | undefined>(
    () => this.item()?.production?.brief,
  );

  readonly referenceLinks = computed<string[]>(
    () => this.brief()?.referenceLinks ?? [],
  );
  readonly dueDate = computed<string | undefined>(() => this.brief()?.dueDate);
  readonly campaignName = computed<string | undefined>(
    () => this.brief()?.campaignName,
  );
  readonly destinationUrl = computed<string | undefined>(
    () => this.brief()?.destinationUrl,
  );
  readonly legalApprover = computed<string | undefined>(
    () => this.brief()?.legalApprover,
  );
  readonly publishingMode = computed<PublishingModeContract | undefined>(
    () => this.brief()?.publishingMode,
  );
  readonly primaryCta = computed<PrimaryCtaContract | undefined>(
    () => this.brief()?.primaryCta,
  );
  readonly approvalNote = computed<string>(
    () => this.brief()?.approvalNote ?? '',
  );

  readonly paidBoosted = computed(
    () => this.publishingMode() === 'PAID_BOOSTED',
  );

  readonly pastDueDate = computed(() => {
    const d = this.dueDate();
    if (!d) return false;
    const date = new Date(d);
    if (isNaN(date.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date.getTime() < today.getTime();
  });

  setReferenceLinks(links: string[]): void {
    this.persistBrief({ referenceLinks: links });
  }

  addReferenceLink(url: string): void {
    const trimmed = url.trim();
    if (!trimmed) return;
    this.persistBrief({ referenceLinks: [...this.referenceLinks(), trimmed] });
  }

  removeReferenceLink(index: number): void {
    const next = this.referenceLinks().filter((_, i) => i !== index);
    this.persistBrief({ referenceLinks: next });
  }

  setDueDate(v: string): void {
    this.persistBrief({ dueDate: v.trim() || undefined });
  }

  setCampaignName(v: string): void {
    // Paid/Boosted fields are editable from packaging — see
    // persistPackagingSideBrief for the carve-out.
    this.persistPackagingSideBrief({ campaignName: v.trim() || undefined });
  }

  setPublishingMode(v: PublishingModeContract | undefined): void {
    this.persistPackagingSideBrief({ publishingMode: v });
  }

  setDestinationUrl(v: string): void {
    this.persistPackagingSideBrief({
      destinationUrl: v.length > 0 ? v : undefined,
    });
  }

  setLegalApprover(v: string): void {
    this.persistPackagingSideBrief({
      legalApprover: v.length > 0 ? v : undefined,
    });
  }

  /**
   * Brief-side fields the Packaging step legitimately edits even after the
   * brief is approved. publishingMode, destinationUrl, legalApprover all
   * live on the brief but are the user's canonical packaging-side decisions
   * per the prototype — locking them after approval would break that flow.
   * All other brief fields stay gated via persistBrief.
   */
  private persistPackagingSideBrief(
    patch: Partial<ProductionBriefContract>,
  ): void {
    const item = this.item();
    if (!item) return;
    const nextBrief: ProductionBriefContract = {
      ...(item.production?.brief ?? {}),
      ...patch,
    };
    const next: ContentItem = {
      ...item,
      production: { ...item.production, brief: nextBrief },
      updatedAt: new Date().toISOString(),
    };
    this.state.saveItem(next);
  }

  setPrimaryCta(v: PrimaryCtaContract | undefined): void {
    this.persistBrief({ primaryCta: v });
  }

  togglePrimaryCta(v: PrimaryCtaContract): void {
    this.setPrimaryCta(this.primaryCta() === v ? undefined : v);
  }

  setApprovalNote(v: string): void {
    this.persistBrief({ approvalNote: v.length > 0 ? v : undefined });
  }

  // ── brief flags (compliance / talent / music / accessibility) ──────
  // These are surfaced via the Flags card on the Draft step and stay
  // editable POST brief-approval (compliance reality can change during
  // production — a script edit introduces a claim, talent gets added,
  // licensed music gets swapped in, etc). So they bypass the
  // briefApproved write-lock that gates the rest of brief fields.

  readonly hasClaims = computed<boolean>(
    () => !!(this.brief()?.compliance as { containsClaims?: boolean } | undefined)
      ?.containsClaims,
  );
  readonly hasTalent = computed<boolean>(() => !!this.brief()?.hasTalent);
  readonly hasMusic = computed<boolean>(() => !!this.brief()?.hasMusic);
  // Accessibility defaults to TRUE: omitted ≠ "not needed", it means
  // "needed by default." Only an explicit `false` disables.
  readonly needsAccessibility = computed<boolean>(
    () => this.brief()?.needsAccessibility !== false,
  );

  readonly activeFlagCount = computed<number>(() => {
    let n = 0;
    if (this.hasClaims()) n++;
    if (this.hasTalent()) n++;
    if (this.hasMusic()) n++;
    if (this.needsAccessibility()) n++;
    return n;
  });

  setHasClaims(v: boolean): void {
    this.persistBriefFlag('hasClaims', v);
  }
  setHasTalent(v: boolean): void {
    this.persistBriefFlag('hasTalent', v);
  }
  setHasMusic(v: boolean): void {
    this.persistBriefFlag('hasMusic', v);
  }
  setNeedsAccessibility(v: boolean): void {
    this.persistBriefFlag('needsAccessibility', v);
  }

  // ── brief approval lifecycle ────────────────────────────────────────
  approveBrief(approvedBy = 'You'): void {
    const item = this.item();
    if (!item) return;
    // Auto-advance the persisted productionStep to 'draft' on approval so
    // the next visit lands the user on the next step. Doesn't change the
    // current activeStep — the user explicitly clicks "Continue to Draft"
    // to navigate; this only changes WHERE THE NEXT VISIT lands.
    this.state.saveItem({
      ...item,
      briefApproved: true,
      briefApprovedAt: new Date().toISOString(),
      briefApprovedBy: approvedBy,
      production: {
        ...item.production,
        productionStep: 'draft',
      },
      updatedAt: new Date().toISOString(),
    });
  }

  unlockBrief(): void {
    const item = this.item();
    if (!item) return;
    const now = new Date().toISOString();
    this.state.saveItem({
      ...item,
      briefApproved: false,
      briefApprovedAt: undefined,
      briefApprovedBy: undefined,
      production: {
        ...item.production,
        brief: { ...(item.production?.brief ?? {}), unlockedAt: now },
      },
      updatedAt: now,
    });
  }

  // ── draft sub-field setters (production.draft) ─────────────────────
  readonly draft = computed<ProductionDraftContract | undefined>(
    () => this.item()?.production?.draft,
  );
  readonly videoDraft = computed<ProductionDraftVideoContract>(
    () => this.draft()?.video ?? {},
  );
  readonly videoLongDraft = computed<ProductionDraftVideoLongContract>(
    () => this.draft()?.videoLong ?? {},
  );
  readonly imageSingleDraft = computed<ProductionDraftImageSingleContract>(
    () => this.draft()?.imageSingle ?? {},
  );
  readonly carouselDraft = computed<ProductionDraftCarouselContract>(
    () => this.draft()?.carousel ?? {},
  );
  readonly textDraft = computed<ProductionDraftTextContract>(
    () => this.draft()?.text ?? {},
  );

  // VIDEO setters
  setVideoHook(v: string): void {
    this.persistVideoDraft({ hook: v });
  }
  setVideoBody(v: string): void {
    this.persistVideoDraft({ body: v });
  }
  setVideoCta(v: string): void {
    this.persistVideoDraft({ cta: v });
  }
  setVideoHookBank(v: string[]): void {
    this.persistVideoDraft({ hookBank: v });
  }
  setVideoTargetDuration(v: string): void {
    this.persistVideoDraft({ targetDuration: v });
  }
  setVideoBRollNotes(v: string): void {
    this.persistVideoDraft({ bRollNotes: v });
  }
  setVideoVoiceoverNotes(v: string): void {
    this.persistVideoDraft({ voiceoverNotes: v });
  }
  setVideoShotList(v: DraftShotItemContract[]): void {
    this.persistVideoDraft({ shotList: v });
  }
  setVideoUploadedAssets(v: DraftUploadedAssetContract[]): void {
    this.persistVideoDraft({ uploadedAssets: v });
  }
  /**
   * #139: atomic update of the upload pool AND the shot list in a
   * single saveItem call. Used by the cascade-on-remove flow in
   * `<app-video-builder>`: when an asset is removed from the pool, any
   * shot referencing it must be cleared in the SAME persist op,
   * otherwise the async PUTs race and the second one reads a stale
   * cache snapshot that re-introduces the removed asset.
   */
  setVideoUploadedAssetsAndShotList(
    assets: DraftUploadedAssetContract[],
    shots: DraftShotItemContract[],
  ): void {
    this.persistVideoDraft({ uploadedAssets: assets, shotList: shots });
  }

  // VIDEO_LONG setters
  setVideoLongHook(v: string): void {
    this.persistVideoLongDraft({ hook: v });
  }
  setVideoLongSequenceBlocks(v: DraftSequenceBlockContract[]): void {
    this.persistVideoLongDraft({ sequenceBlocks: v });
  }
  setVideoLongTargetDuration(v: string): void {
    this.persistVideoLongDraft({ targetDuration: v });
  }
  setVideoLongVoiceoverNotes(v: string): void {
    this.persistVideoLongDraft({ voiceoverNotes: v });
  }

  // IMAGE_SINGLE setters
  setImageSingleHook(v: string): void {
    this.persistImageSingleDraft({ hook: v });
  }
  setImageSingleCreativeDirectionNotes(v: string): void {
    this.persistImageSingleDraft({ creativeDirectionNotes: v });
  }
  setImageSingleImageRef(v: string): void {
    this.persistImageSingleDraft({ imageRef: v });
  }
  setImageSingleAltText(v: string): void {
    this.persistImageSingleDraft({ altText: v });
  }
  setImageSingleHashtags(v: string[]): void {
    this.persistImageSingleDraft({ hashtags: v });
  }

  // CAROUSEL setters
  setCarouselHook(v: string): void {
    this.persistCarouselDraft({ hook: v });
  }
  setCarouselSlides(v: DraftCarouselSlideContract[]): void {
    this.persistCarouselDraft({ slides: v });
  }
  setCarouselHashtags(v: string[]): void {
    this.persistCarouselDraft({ hashtags: v });
  }

  // TEXT setters
  setTextCaption(v: string): void {
    this.persistTextDraft({ caption: v });
  }
  setTextImageRef(v: string): void {
    this.persistTextDraft({ imageRef: v });
  }
  setTextAltText(v: string): void {
    this.persistTextDraft({ altText: v });
  }
  setTextHashtags(v: string[]): void {
    this.persistTextDraft({ hashtags: v });
  }

  // ── menu actions ────────────────────────────────────────────────────
  archive(): void {
    const item = this.item();
    if (!item) return;
    this.state.saveItem({
      ...item,
      archived: true,
      updatedAt: new Date().toISOString(),
    });
  }

  unarchive(): void {
    const item = this.item();
    if (!item) return;
    this.state.saveItem({
      ...item,
      archived: false,
      updatedAt: new Date().toISOString(),
    });
  }

  duplicate(): ContentItem | null {
    const item = this.item();
    if (!item) return null;
    const now = new Date().toISOString();
    const copy: ContentItem = {
      ...item,
      id: generateId('c'),
      title: `${item.title} (copy)`,
      archived: false,
      briefApproved: false,
      briefApprovedAt: undefined,
      briefApprovedBy: undefined,
      createdAt: now,
      updatedAt: now,
    };
    this.state.saveItem(copy);
    return copy;
  }

  deleteSelf(): void {
    const item = this.item();
    if (!item) return;
    this.state.deleteItem(item.id);
  }

  // ── validation ──────────────────────────────────────────────────────
  readonly titleValid = computed(
    () => (this.item()?.title?.trim().length ?? 0) > 0,
  );

  readonly descriptionInRange = computed(() => {
    const len = this.item()?.description?.trim().length ?? 0;
    return len >= DESCRIPTION_MIN_CHARS && len <= DESCRIPTION_MAX_CHARS;
  });

  readonly platformValid = computed(() => {
    const p = this.item()?.platform;
    return !!p && p !== 'tbd';
  });

  readonly contentTypeValid = computed(() => !!this.item()?.contentType);

  readonly objectiveValid = computed(() => !!this.item()?.objective);

  readonly keyMessageValid = computed(() => {
    const km = this.item()?.keyMessage?.trim() ?? '';
    return km.length > 0 && km.length <= KEY_MESSAGE_MAX_CHARS;
  });

  readonly pillarsValid = computed(() => {
    const n = this.item()?.pillarIds?.length ?? 0;
    return n >= 1 && n <= MAX_PILLARS_PER_ITEM;
  });

  readonly segmentsValid = computed(
    () => (this.item()?.segmentIds?.length ?? 0) >= 1,
  );

  readonly ctaValid = computed(() => {
    const cta = this.item()?.cta;
    if (!cta) return true;
    const text = cta.text.trim();
    return text.length > 0 && text.length <= CTA_TEXT_MAX_CHARS;
  });

  readonly ctaTypeValid = computed(() => !!this.item()?.cta?.type);

  readonly ownerValid = computed(() => {
    const owner = this.item()?.owner;
    return !!owner && owner.trim().length > 0;
  });

  // Brief approval list — only the fields the post-detail brief actually
  // edits. Title / Description / Platform / Content Type / Content Goal /
  // Pillars / Audience are all set during the concept stage and locked here,
  // so they don't belong in the brief's Required-to-approve list. Mirrors
  // the prototype's BriefBuilder errors at lines 453-458.
  readonly briefErrors = computed<BriefValidationIssue[]>(() => {
    const out: BriefValidationIssue[] = [];
    if (!this.keyMessageValid())
      out.push({ field: 'keyMessage', label: 'Key message is required' });
    if (!this.ownerValid())
      out.push({ field: 'owner', label: 'Owner is required' });
    if (!this.ctaTypeValid())
      out.push({ field: 'ctaType', label: 'CTA type is required' });
    return out;
  });

  // Step-aware errors: callers ask for "the errors I should display right
  // now," and the answer depends on which step is active. Brief consumers
  // (e.g. the approve toggle) keep using briefErrors directly so they
  // don't get polluted by draft / packaging state.
  readonly errors = computed<BriefValidationIssue[]>(() => {
    if (this.activeStep() === 'packaging') return this.packagingErrors();
    if (this.activeStep() === 'draft') return this.draftErrors();
    return this.briefErrors();
  });

  readonly warnings = computed<BriefValidationIssue[]>(() => {
    const out: BriefValidationIssue[] = [];
    const km = this.item()?.keyMessage ?? '';
    if (km.length >= KEY_MESSAGE_MAX_CHARS - 20 && km.length <= KEY_MESSAGE_MAX_CHARS) {
      out.push({
        field: 'keyMessage',
        label: 'Key message is near the max length',
      });
    }
    const pillarCount = this.item()?.pillarIds?.length ?? 0;
    if (pillarCount === MAX_PILLARS_PER_ITEM) {
      out.push({
        field: 'pillars',
        label: 'Pillar limit reached — focus may suffer',
      });
    }
    return out;
  });

  readonly requiredFieldsTotal = 8; // title/description/platform/content-type/objective/key-message/pillars/segments

  readonly requiredFieldsDone = computed(() => {
    let done = 0;
    if (this.titleValid()) done++;
    if (this.descriptionInRange()) done++;
    if (this.platformValid()) done++;
    if (this.contentTypeValid()) done++;
    if (this.objectiveValid()) done++;
    if (this.keyMessageValid()) done++;
    if (this.pillarsValid()) done++;
    if (this.segmentsValid()) done++;
    return done;
  });

  // canApprove gates only on the brief's errors. Drafting can never
  // accidentally re-disable a previously-approved brief.
  readonly canApprove = computed(() => this.briefErrors().length === 0);

  // ── draft validation (per mode) ─────────────────────────────────────
  readonly draftErrors = computed<BriefValidationIssue[]>(() => {
    return this.computeDraftErrorsForMode(this.draft()?.mode);
  });

  computeDraftErrorsForMode(
    mode: ProductionDraftContract['mode'] | undefined,
  ): BriefValidationIssue[] {
    const out: BriefValidationIssue[] = [];
    switch (mode) {
      case 'VIDEO': {
        const v = this.videoDraft();
        if (!v.hook?.trim().length)
          out.push({ field: 'hook', label: 'Hook is required' });
        if ((v.shotList?.length ?? 0) < 1)
          out.push({ field: 'shotList', label: 'At least one shot is required' });
        return out;
      }
      case 'VIDEO_LONG': {
        const v = this.videoLongDraft();
        if (!v.sequenceBlocks?.some((b) => b.description.trim().length > 0))
          out.push({
            field: 'sequenceBlocks',
            label: 'At least one sequence block with a description is required',
          });
        return out;
      }
      case 'IMAGE_SINGLE': {
        const v = this.imageSingleDraft();
        if (!v.hook?.trim().length)
          out.push({ field: 'hook', label: 'Hook is required' });
        if (!v.imageRef?.trim().length)
          out.push({ field: 'imageRef', label: 'An image is required' });
        return out;
      }
      case 'CAROUSEL': {
        const v = this.carouselDraft();
        if (!v.hook?.trim().length)
          out.push({ field: 'hook', label: 'Hook is required' });
        const filled = (v.slides ?? []).filter(
          (s) => s.headline.trim().length > 0,
        );
        if (filled.length < 2)
          out.push({
            field: 'slides',
            label: 'At least two slides with headlines are required',
          });
        return out;
      }
      case 'TEXT': {
        const v = this.textDraft();
        if (!v.caption?.trim().length)
          out.push({ field: 'caption', label: 'Caption is required' });
        return out;
      }
      default:
        out.push({
          field: 'mode',
          label: 'This builder is not yet supported',
        });
        return out;
    }
  }

  readonly canContinueFromDraft = computed(
    () => this.draftErrors().length === 0,
  );

  // Per-platform packaging validation (mirrors draftErrors). Required-field
  // rules come from PackagingStudio.tsx:286-385 (the prototype's validate()).
  // Caption-driven platforms require a non-empty caption. YouTube requires
  // title + description (when canonical = VIDEO_LONG_HORIZONTAL the title is
  // hard-required; otherwise warn-only). X enforces 280-char hard cap.
  readonly packagingErrors = computed<BriefValidationIssue[]>(() => {
    return this.computePackagingErrorsForPlatform(this.item()?.platform);
  });

  computePackagingErrorsForPlatform(
    platform: PlatformContract | null | undefined,
  ): BriefValidationIssue[] {
    const out: BriefValidationIssue[] = [];
    const pkg = this.packaging();
    switch (platform) {
      case 'instagram': {
        const v = pkg?.instagram;
        if (!v?.caption?.trim().length)
          out.push({ field: 'caption', label: 'Caption is required' });
        return out;
      }
      case 'tiktok': {
        const v = pkg?.tiktok;
        if (!v?.caption?.trim().length)
          out.push({ field: 'caption', label: 'Caption is required' });
        return out;
      }
      case 'youtube': {
        const v = pkg?.youtube;
        if (!v?.title?.trim().length)
          out.push({ field: 'title', label: 'Title is required' });
        if (!v?.description?.trim().length)
          out.push({ field: 'description', label: 'Description is required' });
        return out;
      }
      case 'linkedin': {
        const v = pkg?.linkedin;
        if (!v?.caption?.trim().length)
          out.push({ field: 'caption', label: 'Caption is required' });
        return out;
      }
      case 'facebook': {
        const v = pkg?.facebook;
        if (!v?.caption?.trim().length)
          out.push({ field: 'caption', label: 'Caption is required' });
        return out;
      }
      case 'x': {
        const v = pkg?.x;
        if (!v?.caption?.trim().length)
          out.push({ field: 'caption', label: 'Caption is required' });
        else if (v.caption.length > 280)
          out.push({ field: 'caption', label: 'Caption exceeds 280 characters' });
        return out;
      }
      default:
        // 'tbd' or undefined — keep Continue disabled with a clear reason.
        out.push({ field: 'platform', label: 'Set a platform first' });
        return out;
    }
  }

  readonly canContinueFromPackaging = computed(
    () => this.packagingErrors().length === 0,
  );

  /**
   * Model A gating: a step's tab is clickable only if every prior step's
   * "ready to continue" gate has been satisfied. This returns the highest
   * index up to which the bar is unlocked.
   *
   *   0  → only Brief is reachable (brief not yet approved)
   *   1  → Brief + Draft (brief approved, draft not yet valid)
   *   2  → Brief + Draft + Packaging (draft valid, packaging not yet valid)
   *   3  → all four steps reachable
   *
   * The bar reads this and uses `i <= unlockedThroughIndex()` to gate
   * tab clicks. `isPast(i)` correspondingly means `unlockedThroughIndex() > i`
   * (step i's gate has been satisfied).
   */
  readonly unlockedThroughIndex = computed<number>(() => {
    if (!this.item()?.briefApproved) return 0;
    if (!this.canContinueFromDraft()) return 1;
    if (!this.canContinueFromPackaging()) return 2;
    return 3;
  });

  // ── internal ────────────────────────────────────────────────────────
  private persist(patch: Partial<ContentItem>): void {
    const item = this.item();
    if (!item) return;
    if (item.briefApproved) return;
    const next: ContentItem = {
      ...item,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    this.state.saveItem(next);
  }

  // Patch a sub-key on production.brief, gated by the same write-lock.
  private persistBrief(patch: Partial<ProductionBriefContract>): void {
    const item = this.item();
    if (!item) return;
    if (item.briefApproved) return;
    const nextBrief: ProductionBriefContract = {
      ...(item.production?.brief ?? {}),
      ...patch,
    };
    const next: ContentItem = {
      ...item,
      production: { ...item.production, brief: nextBrief },
      updatedAt: new Date().toISOString(),
    };
    this.state.saveItem(next);
  }

  // Toggle a single compliance flag on production.brief. NOT gated by
  // briefApproved — see the comment block above the public setters for
  // why. `hasClaims` lives nested under brief.compliance.containsClaims;
  // the other three are top-level brief booleans.
  private persistBriefFlag(
    flag: 'hasClaims' | 'hasTalent' | 'hasMusic' | 'needsAccessibility',
    value: boolean,
  ): void {
    const item = this.item();
    if (!item) return;
    const currentBrief: ProductionBriefContract = item.production?.brief ?? {};
    let nextBrief: ProductionBriefContract;
    if (flag === 'hasClaims') {
      const currentCompliance = (currentBrief.compliance ?? {}) as Record<
        string,
        unknown
      >;
      nextBrief = {
        ...currentBrief,
        compliance: { ...currentCompliance, containsClaims: value },
      };
    } else {
      nextBrief = { ...currentBrief, [flag]: value };
    }
    const next: ContentItem = {
      ...item,
      production: { ...item.production, brief: nextBrief },
      updatedAt: new Date().toISOString(),
    };
    this.state.saveItem(next);
  }

  // Patch one mode slot on production.draft. Drafting is GATED by
  // briefApproved being true (you can't draft until the brief has
  // been approved); after a brief unlock, draft state is preserved
  // but cannot be edited until the brief is re-approved.
  private persistDraftSlot<
    K extends Exclude<keyof ProductionDraftContract, 'mode'>,
  >(
    slot: K,
    patch: Partial<NonNullable<ProductionDraftContract[K]>>,
  ): void {
    const item = this.item();
    if (!item) return;
    if (!item.briefApproved) return;
    const draft: ProductionDraftContract = item.production?.draft ?? {};
    const current = (draft[slot] ?? {}) as Record<string, unknown>;
    const merged = { ...current, ...patch } as unknown as ProductionDraftContract[K];
    const nextDraft: ProductionDraftContract = { ...draft, [slot]: merged };
    const next: ContentItem = {
      ...item,
      production: { ...item.production, draft: nextDraft },
      updatedAt: new Date().toISOString(),
    };
    this.state.saveItem(next);
  }

  private persistVideoDraft(patch: Partial<ProductionDraftVideoContract>): void {
    this.persistDraftSlot('video', patch);
  }
  private persistVideoLongDraft(
    patch: Partial<ProductionDraftVideoLongContract>,
  ): void {
    this.persistDraftSlot('videoLong', patch);
  }
  private persistImageSingleDraft(
    patch: Partial<ProductionDraftImageSingleContract>,
  ): void {
    this.persistDraftSlot('imageSingle', patch);
  }
  private persistCarouselDraft(
    patch: Partial<ProductionDraftCarouselContract>,
  ): void {
    this.persistDraftSlot('carousel', patch);
  }
  private persistTextDraft(patch: Partial<ProductionDraftTextContract>): void {
    this.persistDraftSlot('text', patch);
  }

  // Set the canonical draft mode at brief-approval time. Callers should
  // invoke this when transitioning Brief → Draft so a later platform/contentType
  // change can't silently retarget the draft.
  setDraftMode(mode: ProductionDraftContract['mode']): void {
    const item = this.item();
    if (!item) return;
    if (!item.briefApproved) return;
    const draft: ProductionDraftContract = item.production?.draft ?? {};
    if (draft.mode === mode) return;
    const nextDraft: ProductionDraftContract = { ...draft, mode };
    const next: ContentItem = {
      ...item,
      production: { ...item.production, draft: nextDraft },
      updatedAt: new Date().toISOString(),
    };
    this.state.saveItem(next);
  }

  // ── Packaging slot (#116) ────────────────────────────────────────────
  readonly packaging = computed<ProductionPackagingContract | undefined>(
    () => this.item()?.production?.packaging,
  );
  readonly instagramPackaging = computed<PackagingInstagramContract | undefined>(
    () => this.packaging()?.instagram,
  );
  readonly tiktokPackaging = computed<PackagingTikTokContract | undefined>(
    () => this.packaging()?.tiktok,
  );
  readonly youtubePackaging = computed<PackagingYouTubeContract | undefined>(
    () => this.packaging()?.youtube,
  );
  readonly linkedinPackaging = computed<PackagingLinkedInContract | undefined>(
    () => this.packaging()?.linkedin,
  );
  readonly facebookPackaging = computed<PackagingFacebookContract | undefined>(
    () => this.packaging()?.facebook,
  );
  readonly xPackaging = computed<PackagingXContract | undefined>(
    () => this.packaging()?.x,
  );

  /**
   * Replace a per-platform packaging slot with a merged-in patch. Same
   * briefApproved write-lock as the brief / draft slots — packaging
   * can only be edited once the brief is approved.
   */
  setInstagramPackaging(value: PackagingInstagramContract): void {
    this.persistPackagingSlot('instagram', value);
  }
  setTikTokPackaging(value: PackagingTikTokContract): void {
    this.persistPackagingSlot('tiktok', value);
  }
  setYouTubePackaging(value: PackagingYouTubeContract): void {
    this.persistPackagingSlot('youtube', value);
  }
  setLinkedInPackaging(value: PackagingLinkedInContract): void {
    this.persistPackagingSlot('linkedin', value);
  }
  setFacebookPackaging(value: PackagingFacebookContract): void {
    this.persistPackagingSlot('facebook', value);
  }
  setXPackaging(value: PackagingXContract): void {
    this.persistPackagingSlot('x', value);
  }

  private persistPackagingSlot<
    K extends Exclude<keyof ProductionPackagingContract, 'platform'>,
  >(slot: K, value: NonNullable<ProductionPackagingContract[K]>): void {
    const item = this.item();
    if (!item) return;
    if (!item.briefApproved) return;
    const pkg: ProductionPackagingContract = item.production?.packaging ?? {};
    const nextPkg: ProductionPackagingContract = {
      ...pkg,
      platform: pkg.platform ?? item.platform ?? undefined,
      [slot]: value,
    };
    const next: ContentItem = {
      ...item,
      production: { ...item.production, packaging: nextPkg },
      updatedAt: new Date().toISOString(),
    };
    this.state.saveItem(next);
  }

  // ── QA / Approve & Schedule slot (#124) ──────────────────────────────
  // Hardcoded default workflow: a single required Brand Reviewer. Real
  // workspace-level workflow customization is out of scope for this ticket.
  readonly qa = computed<ProductionQAContract | undefined>(
    () => this.item()?.production?.qa,
  );

  readonly approvals = computed<ApprovalEntryContract[]>(() => {
    const persisted = this.qa()?.approvals;
    if (persisted && persisted.length > 0) return persisted;
    return DEFAULT_APPROVAL_WORKFLOW.map((entry) => ({ ...entry }));
  });

  /**
   * Returns the persisted publish config (action, visibility, account,
   * delivery flags). The scheduling timestamp lives on top-level
   * `item.scheduledAt` — derive its picker representation via
   * {@link publishScheduledAtLocal}, not from this object.
   */
  readonly publishConfig = computed<PublishConfigContract>(() => {
    const persisted = this.qa()?.publishConfig ?? DEFAULT_PUBLISH_CONFIG;
    // When a top-level scheduledAt exists but the persisted publishAction
    // is missing or still defaulted to 'save-draft', surface 'schedule' as
    // the implied action so the UI reflects the actual state of the item.
    const top = this.item()?.scheduledAt;
    if (top && (!persisted.publishAction || persisted.publishAction === 'save-draft')) {
      return { ...persisted, publishAction: 'schedule' };
    }
    return persisted;
  });

  /** Datetime-local-formatted view of the top-level `scheduledAt` for the picker. */
  readonly publishScheduledAtLocal = computed<string>(() => {
    const top = this.item()?.scheduledAt;
    return top ? isoToDatetimeLocal(top) : '';
  });

  readonly qaApproved = computed<boolean>(() => !!this.qa()?.approved);

  readonly requiredApprovals = computed<ApprovalEntryContract[]>(
    () => this.approvals().filter((a) => a.required),
  );

  readonly pendingRequired = computed<ApprovalEntryContract[]>(
    () => this.requiredApprovals().filter((a) => a.status !== 'approved'),
  );

  readonly hasChangesRequested = computed<boolean>(
    () => this.approvals().some((a) => a.status === 'changes-requested'),
  );

  readonly canApproveAndPublish = computed<boolean>(
    () => this.pendingRequired().length === 0 && !this.hasChangesRequested(),
  );

  /**
   * Set an approval row's status. Mutates the matching entry in the
   * persisted approvals list (creates the list from the default workflow
   * if not yet persisted) and stamps a timestamp. Empty `note` clears
   * any prior note on that row.
   */
  setApprovalStatus(
    role: string,
    status: ApprovalStatusContract,
    note?: string,
  ): void {
    const current = this.approvals();
    const next = current.map((a) =>
      a.role === role
        ? {
            ...a,
            status,
            note: note?.trim() ? note.trim() : undefined,
            timestamp: new Date().toISOString(),
          }
        : a,
    );
    this.persistQA({ approvals: next });
  }

  /**
   * Writer for publishConfig fields (action / visibility / account /
   * delivery / notify flags). The scheduling timestamp is held on
   * top-level `item.scheduledAt` — use {@link setPublishScheduledAt} for
   * datetime changes. Status flips happen when the combined post-write
   * state implies a schedule:
   *   publishAction === 'schedule' AND scheduledAt is set → status 'scheduled'
   *   otherwise → status 'review' (only flips down from 'scheduled')
   */
  setPublishConfig(patch: Partial<PublishConfigContract>): void {
    const item = this.item();
    if (!item) return;
    if (!item.briefApproved) return;

    const currentConfig = this.qa()?.publishConfig ?? DEFAULT_PUBLISH_CONFIG;
    const nextConfig: PublishConfigContract = { ...currentConfig, ...patch };

    const currentQA: ProductionQAContract = item.production?.qa ?? {};
    const nextQA: ProductionQAContract = {
      ...currentQA,
      publishConfig: nextConfig,
    };
    const next: ContentItem = {
      ...item,
      production: { ...item.production, qa: nextQA },
      updatedAt: new Date().toISOString(),
    };
    this.state.saveItem(next);
  }

  /**
   * Writer for the scheduling timestamp. Accepts a datetime-local string
   * and persists to top-level `item.scheduledAt`. Does NOT change
   * `status` — #140 removes the implicit auto-flip; status changes only
   * happen via {@link finishPost}.
   */
  setPublishScheduledAt(localValue: string | undefined): void {
    const item = this.item();
    if (!item) return;
    if (!item.briefApproved) return;

    const iso = localValue ? datetimeLocalToIso(localValue) : null;

    const next: ContentItem = {
      ...item,
      scheduledAt: iso,
      updatedAt: new Date().toISOString(),
    };
    this.state.saveItem(next);
  }

  /**
   * #140 (Publish Flow): the single gate that moves a post out of Post
   * Builder. Reads `qa.publishConfig.publishAction` + `item.scheduledAt`
   * and routes to one of five branches per spec §3.2:
   *  - save-draft → no status change, "Draft saved." toast
   *  - schedule → status='scheduled', `scheduledAt` persisted
   *  - publish-now → status='published', `publishedAt` set, mock `livePostUrl`
   *  - export-packet (future date) → status='scheduled', `isExported=true`
   *  - export-packet (no date) → status='published', `publishedAt` set, `isExported=true`
   *
   * Caller is responsible for showing the Export Packet confirmation
   * dialog *before* invoking this method for the export branch; when
   * `finishPost()` is called for export-packet the user has already
   * clicked Download.
   *
   * Gates: briefApproved + canApproveAndPublish. Bails silently
   * otherwise — the trigger button's disabled state already prevents
   * the unsafe call, this is belt-and-suspenders.
   */
  finishPost(): void {
    const item = this.item();
    if (!item) return;
    if (!item.briefApproved) return;
    if (!this.canApproveAndPublish()) return;

    const config = this.publishConfig();
    const scheduledAt = item.scheduledAt ?? null;
    const platform = item.platform ?? 'instagram';
    const nowIso = new Date().toISOString();

    switch (config.publishAction) {
      case 'save-draft':
        this.toast.showSuccess('Draft saved.');
        return;

      case 'schedule':
        this.commitPublishPatch({ status: 'scheduled', scheduledAt });
        this.toast.showSuccess(
          `Post scheduled for ${formatScheduledAt(scheduledAt)}.`,
        );
        return;

      case 'publish-now':
        this.commitPublishPatch({
          status: 'published',
          publishedAt: nowIso,
          livePostUrl: buildMockPostUrl(platform, item.id),
        });
        this.toast.showSuccess('Post published.');
        return;

      case 'export-packet': {
        const future = scheduledAt && new Date(scheduledAt).getTime() > Date.now();
        if (future) {
          this.commitPublishPatch({
            status: 'scheduled',
            scheduledAt,
            isExported: true,
          });
          this.toast.showSuccess(
            `Export downloaded — post scheduled for ${formatScheduledAt(scheduledAt)}.`,
          );
        } else {
          this.commitPublishPatch({
            status: 'published',
            publishedAt: nowIso,
            isExported: true,
          });
          this.toast.showSuccess('Export downloaded — post marked as published.');
        }
        return;
      }
    }
  }

  private commitPublishPatch(patch: Partial<ContentItem>): void {
    const item = this.item();
    if (!item) return;
    const next: ContentItem = {
      ...item,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    this.state.saveItem(next);
  }

  /**
   * Flip `qa.approved` to true and stamp `qaApprovedAt` / `qaApprovedBy`.
   * Real publishing is downstream; this is the persistence-only commit
   * the prototype's "Approved — Publish" button represents.
   */
  markApproved(approvedBy = 'You'): void {
    this.persistQA({
      approved: true,
      qaApprovedAt: new Date().toISOString(),
      qaApprovedBy: approvedBy,
    });
  }

  // Patch the production.qa slot. Same briefApproved write-lock as the
  // draft/packaging slots — Approve & Schedule is downstream of brief
  // approval and cannot be edited before the brief is approved.
  private persistQA(patch: Partial<ProductionQAContract>): void {
    const item = this.item();
    if (!item) return;
    if (!item.briefApproved) return;
    const currentQA: ProductionQAContract = item.production?.qa ?? {};
    const nextQA: ProductionQAContract = { ...currentQA, ...patch };
    const next: ContentItem = {
      ...item,
      production: { ...item.production, qa: nextQA },
      updatedAt: new Date().toISOString(),
    };
    this.state.saveItem(next);
  }
}

// Default approval workflow: a single required Brand Reviewer. Used when
// the post has no persisted approvals yet. The store always returns a
// fresh-mapped copy so consumers never mutate the constant.
const DEFAULT_APPROVAL_WORKFLOW: ReadonlyArray<ApprovalEntryContract> = [
  {
    role: 'brand-reviewer',
    label: 'Brand Reviewer',
    required: true,
    status: 'pending',
  },
];

const DEFAULT_PUBLISH_CONFIG: PublishConfigContract = {
  publishAction: 'save-draft',
  deliveryMethod: 'auto',
};

/**
 * Human-friendly "Fri, May 15 · 2:30 PM" format used in Finish toasts.
 * Falls back to the raw ISO when the input is null/invalid.
 */
function formatScheduledAt(iso: string | null): string {
  if (!iso) return 'a future date';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * #140: mock live-post URL set on Publish Now. Pattern is intentionally
 * obvious so users see this is a placeholder until the real platform-API
 * integration lands (see spec §8 Open Items).
 */
function buildMockPostUrl(platform: PlatformContract, id: string): string {
  const slug = id.slice(0, 8);
  switch (platform) {
    case 'instagram': return `https://www.instagram.com/p/mock-${slug}/`;
    case 'tiktok':    return `https://www.tiktok.com/@mock/video/mock-${slug}`;
    case 'youtube':   return `https://www.youtube.com/watch?v=mock-${slug}`;
    case 'facebook':  return `https://www.facebook.com/mock/posts/mock-${slug}`;
    case 'linkedin':  return `https://www.linkedin.com/posts/mock-${slug}`;
    case 'x':         return `https://x.com/mock/status/mock-${slug}`;
    default:          return `https://example.com/mock/${slug}`;
  }
}

/**
 * Convert an HTML `datetime-local` string (`YYYY-MM-DDTHH:mm`) to a UTC ISO
 * timestamp. Treats the input as UTC so the conversion is TZ-independent
 * and deterministic — matches the prototype's "raw string, no TZ math"
 * persistence model and keeps unit tests free of TZ shims. Returns `null`
 * for empty / unparseable input.
 */
function datetimeLocalToIso(s: string): string | null {
  const trimmed = s?.trim();
  if (!trimmed) return null;
  // Append seconds + Z so the Date constructor parses as UTC.
  const padded = trimmed.length === 16 ? `${trimmed}:00.000Z` : trimmed;
  const d = new Date(padded);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/**
 * Reverse of {@link datetimeLocalToIso}. Slices the ISO string to the
 * 16-char `YYYY-MM-DDTHH:mm` prefix so the value drops straight into a
 * `datetime-local` input.
 */
function isoToDatetimeLocal(iso: string): string {
  return iso.slice(0, 16);
}
