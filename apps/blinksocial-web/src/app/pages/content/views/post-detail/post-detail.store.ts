import { Injectable, computed, effect, inject, signal } from '@angular/core';
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
  DraftCarouselSlideContract,
  DraftSequenceBlockContract,
  DraftShotItemContract,
  PrimaryCtaContract,
  ProductionBriefContract,
  ProductionDraftCarouselContract,
  ProductionDraftContract,
  ProductionDraftImageSingleContract,
  ProductionDraftTextContract,
  ProductionDraftVideoContract,
  ProductionDraftVideoLongContract,
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

  private readonly _itemId = signal<string | null>(null);

  readonly item = computed<ContentItem | null>(
    () => this.state.items().find((i) => i.id === this._itemId()) ?? null,
  );
  readonly pillars = this.state.pillars;
  readonly segments = this.state.segments;

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
   */
  advanceProductionStep(step: ProductionStep): void {
    this.activeStep.set(step);
    const item = this.item();
    if (!item) return;
    const next: ContentItem = {
      ...item,
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
    this.persistBrief({ campaignName: v.trim() || undefined });
  }

  setPublishingMode(v: PublishingModeContract | undefined): void {
    this.persistBrief({ publishingMode: v });
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
  setVideoCoverAssetRef(v: string | undefined): void {
    this.persistVideoDraft({ coverAssetRef: v });
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
  // don't get polluted by draft state.
  readonly errors = computed<BriefValidationIssue[]>(() => {
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

  // Packaging is not yet implemented — the step renders a placeholder.
  // Until it has a real validation surface, its "ready to continue"
  // predicate is always false, which keeps Approve & Schedule locked in
  // the Model-A gating chain (briefApproved → canContinueFromDraft →
  // canContinueFromPackaging). When we build Packaging, replace this
  // stub with the real per-mode validation, mirroring draftErrors.
  readonly packagingErrors = computed<BriefValidationIssue[]>(() => [
    { field: 'packaging', label: 'Packaging step is not yet implemented' },
  ]);

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
}
