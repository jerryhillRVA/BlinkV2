import type { MilestoneType } from './calendar-settings.js';

export type ContentStageContract = 'idea' | 'concept' | 'post';

export type IdeaConceptStatusContract = 'new' | 'used';

export type PostStatusContract =
  | 'draft'
  | 'in-progress'
  | 'review'
  | 'scheduled'
  | 'published';

export type ContentStatusContract =
  | IdeaConceptStatusContract
  | PostStatusContract;

export type PlatformContract =
  | 'instagram'
  | 'tiktok'
  | 'youtube'
  | 'facebook'
  | 'linkedin'
  | 'x'
  | 'tbd';

export type ContentObjectiveContract =
  | 'awareness'
  | 'engagement'
  | 'traffic'
  | 'leads'
  | 'sales'
  | 'community'
  | 'recruiting'
  | 'lead-gen'
  | 'trust'
  | 'education'
  | 'conversion';

export type ContentTypeContract =
  | 'reel'
  | 'carousel'
  | 'feed-post'
  | 'story'
  | 'guide'
  | 'live'
  | 'short-video'
  | 'photo-carousel'
  | 'long-form'
  | 'shorts'
  | 'live-stream'
  | 'community-post'
  | 'fb-link-post'
  | 'fb-feed-post'
  | 'fb-live'
  | 'fb-reel'
  | 'fb-story'
  | 'ln-text-post'
  | 'ln-document'
  | 'ln-article'
  | 'ln-video'
  | 'tweet'
  | 'thread'
  | 'quote';

export type CtaTypeContract =
  | 'learn-more'
  | 'subscribe'
  | 'follow'
  | 'comment'
  | 'download'
  | 'buy'
  | 'book-call'
  | 'other';

export type TonePresetContract =
  | 'professional'
  | 'casual'
  | 'friendly'
  | 'authoritative'
  | 'inspiring'
  | 'playful';

export interface ContentCtaContract {
  type: CtaTypeContract;
  text: string;
}

export interface ContentAttachmentContract {
  name: string;
  size: string;
  url?: string;
}

export interface TargetPlatformContract {
  platform: PlatformContract;
  contentType: ContentTypeContract;
  postId?: string | null;
}

export interface TargetPublishWindowContract {
  start?: string;
  end?: string;
}

export type RiskLevelContract = 'low' | 'medium' | 'high';

export interface ProductionBriefStrategyContract {
  objective?: ContentObjectiveContract;
  audienceSegmentIds?: string[];
  pillarIds?: string[];
  keyMessage?: string;
  ctaType?: CtaTypeContract;
  ctaText?: string;
  tonePreset?: TonePresetContract;
  doChecklist?: string[];
  dontChecklist?: string[];
}

export interface ProductionBriefPlatformRulesContract {
  durationTarget?: number;
  hookType?: string;
  loopEnding?: boolean;
}

export interface ProductionBriefCreativePlanContract {
  hook?: string;
  storyArc?: string;
  musicNotes?: string;
}

export type ProductionBriefComplianceContract = Record<string, unknown>;

export type PublishingModeContract = 'ORGANIC' | 'PAID_BOOSTED';

export type PrimaryCtaContract =
  | 'sign-up'
  | 'shop-now'
  | 'learn-more'
  | 'book-now'
  | 'download';

export interface ProductionBriefContract {
  strategy?: ProductionBriefStrategyContract;
  platformRules?: ProductionBriefPlatformRulesContract;
  creativePlan?: ProductionBriefCreativePlanContract;
  compliance?: ProductionBriefComplianceContract;
  canonicalType?: string;
  hasTalent?: boolean;
  hasMusic?: boolean;
  needsAccessibility?: boolean;
  referenceLinks?: string[];
  dueDate?: string;
  campaignName?: string;
  // Required when publishingMode = PAID_BOOSTED. Lives on the brief but
  // is editable from the Packaging step (the prototype's canonical
  // entry point for paid-mode metadata).
  destinationUrl?: string;
  legalApprover?: string;
  publishingMode?: PublishingModeContract;
  primaryCta?: PrimaryCtaContract;
  approvalNote?: string;
  unlockedAt?: string;
}

export type ProductionStepContract =
  | 'select'
  | 'brief'
  | 'draft'
  | 'blueprint'
  | 'assets'
  | 'packaging'
  | 'qa'
  | 'handoff';

export type DraftModeContract =
  | 'VIDEO'
  | 'VIDEO_LONG'
  | 'IMAGE_SINGLE'
  | 'CAROUSEL'
  | 'TEXT'
  | 'DOCUMENT'
  | 'STORY'
  | 'LIVE'
  | 'LINK';

export type DraftShotItemTypeContract =
  | 'Shot'
  | 'B-Roll'
  | 'Voiceover'
  | 'Transition'
  | 'CTA';

export interface DraftShotItemContract {
  id: string;
  type: DraftShotItemTypeContract;
  description: string;
  duration: string;
  /**
   * #139: now an id referencing an entry in
   * `ProductionDraftVideoContract.uploadedAssets[]`. Prior to #139 this
   * field held a filename; new code resolves the filename via the pool.
   */
  assetRef?: string;
}

/**
 * #139: a single uploaded asset in the short-form video draft's shared
 * pool. Lives on `ProductionDraftVideoContract.uploadedAssets[]`. Shot
 * rows reference entries by `id` (not filename) so renames don't break
 * shot links. `mimeType` + `size` are optional metadata captured at
 * upload time; the future AgenticFilesystem swap will populate them.
 *
 * `previewUrl` is a **transient** blob URL generated client-side via
 * `URL.createObjectURL(file)` at upload time. It is NOT persisted by
 * the API (the mock harness echoes it back in-memory, but it's a
 * per-document handle that doesn't survive page reload). Once AFS is
 * wired, a real `https://` URL replaces this field. Consumers must
 * treat the field as best-effort: if it's missing, render the icon
 * fallback.
 */
export interface DraftUploadedAssetContract {
  id: string;
  filename: string;
  mimeType?: string;
  size?: number;
  previewUrl?: string;
}

export type DraftSequenceBlockTypeContract =
  | 'Hook'
  | 'Body'
  | 'Section'
  | 'CTA';

export interface DraftSequenceBlockContract {
  id: string;
  type: DraftSequenceBlockTypeContract;
  description: string;
  duration: string;
}

export interface DraftCarouselSlideContract {
  id: string;
  headline: string;
  body: string;
  imageRef?: string;
  altText?: string;
}

export interface ProductionDraftVideoContract {
  hook?: string;
  body?: string;
  cta?: string;
  hookBank?: string[];
  targetDuration?: string;
  bRollNotes?: string;
  voiceoverNotes?: string;
  shotList?: DraftShotItemContract[];
  /**
   * #139: shared pool of uploaded assets for this draft. Shot rows
   * reference entries by id via `DraftShotItemContract.assetRef`. The
   * pre-#139 `coverAssetRef` field was removed — cover-image selection
   * lives in the Packaging step.
   */
  uploadedAssets?: DraftUploadedAssetContract[];
}

export interface ProductionDraftVideoLongContract {
  hook?: string;
  sequenceBlocks?: DraftSequenceBlockContract[];
  targetDuration?: string;
  voiceoverNotes?: string;
}

export interface ProductionDraftImageSingleContract {
  hook?: string;
  creativeDirectionNotes?: string;
  imageRef?: string;
  altText?: string;
  hashtags?: string[];
}

export interface ProductionDraftCarouselContract {
  hook?: string;
  slides?: DraftCarouselSlideContract[];
  hashtags?: string[];
}

export interface ProductionDraftTextContract {
  caption?: string;
  imageRef?: string;
  altText?: string;
  hashtags?: string[];
}

export interface ProductionDraftContract {
  mode?: DraftModeContract;
  video?: ProductionDraftVideoContract;
  videoLong?: ProductionDraftVideoLongContract;
  imageSingle?: ProductionDraftImageSingleContract;
  carousel?: ProductionDraftCarouselContract;
  text?: ProductionDraftTextContract;
}

export type ProductionSourceTypeContract =
  | 'article'
  | 'report'
  | 'social'
  | 'news'
  | 'video'
  | 'docs';

export interface ProductionSourceContract {
  id: string;
  url: string;
  title: string;
  keyTakeaways?: string;
  type: ProductionSourceTypeContract;
}

export interface ProductionAssetContract {
  id: string;
  label: string;
  required: boolean;
  completed: boolean;
  assignee?: string;
  notes?: string;
}

export interface ProductionTaskContract {
  id: string;
  label: string;
  assignee?: string;
  completed: boolean;
  dueDate?: string;
}

export interface ProductionVersionContract {
  label: string;
  savedAt: string;
}

// ── Production Packaging contracts (#116) ──────────────────────────
//
// The Packaging step's persistence payload. Lives alongside `brief` and
// `draft` on ProductionContract. Sibling per-platform slots (not a
// discriminated union — Angular templates handle DUs poorly; siblings
// let each builder read its own typed slot directly via the store).
// Only the slot matching the post's `item.platform` is populated;
// others stay undefined. The optional `platform` field captures the
// canonical platform at packaging-entry time as a defensive
// cross-platform-migration guard (mirror of ProductionDraftContract.mode).

export interface PackagingUtmContract {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
}

/**
 * #147 (PKG-1): replaces the prior `PackagingAudioTrackContract` model.
 * Strategy + mood-driven planning, not a specific-track picker.
 *
 * - `audioStrategy` defaults to `'named'` on a fresh post.
 * - `audioMood` is only meaningful when strategy is `'trending-platform'`;
 *   the UI clears it on flip-back to `'named'`.
 * - `audioSongTitle` / `audioArtist` are reserved (no input fields in
 *   PKG-1) and used by the legacy-`audio` content-state normalizer to
 *   preserve historical track + artist strings.
 */
export type AudioStrategyContract = 'named' | 'trending-platform';

export type AudioMoodContract =
  | 'energetic-pumped'
  | 'relaxing-calm'
  | 'happy-upbeat'
  | 'sad-melancholy'
  | 'romantic-sensual'
  | 'mysterious-mystical'
  | 'scary-spooky-suspense'
  | 'confident-motivational';

export interface PackagingAudioPlanningContract {
  audioStrategy?: AudioStrategyContract;
  audioMood?: AudioMoodContract;
  audioSongTitle?: string;
  audioArtist?: string;
}

export interface PackagingSlideOrderContract {
  order: number[]; // indices into the draft's carousel.slides
}

export type PackagingVisibilityContract = 'public' | 'unlisted' | 'private';

/**
 * Instagram-specific platform-controls. Mirrors the prototype's
 * PlatformControlsData["ig"] in PublishSettingsCard.tsx — rendered
 * conditionally on activeContentType (reel/feed-post/carousel/story/live).
 */
export interface PackagingPlatformControlsIGContract {
  commentsOff?: boolean;
  hideLikeCount?: boolean;
  paidPartnership?: boolean;
  collaboratorTag?: string;
  closeFreindsOnly?: boolean; // spelling matches prototype
  coHostHandles?: string[]; // live, max 4
  fundraiserGoal?: string; // live
  qaMode?: boolean; // live
  notifyFollowers?: boolean; // live
}

export interface PackagingPlatformControlsContract {
  // Legacy flat fields retained for builders that still use the old
  // <app-platform-controls> card (TikTok, YouTube, Facebook, LinkedIn, X).
  // Once those migrate to <app-publish-settings-card> these can be removed.
  visibility?: PackagingVisibilityContract;
  allowComments?: boolean;
  allowDuetStitch?: boolean;
  boostEnabled?: boolean;
  // Per-platform nested shapes (matches prototype's PlatformControlsData).
  ig?: PackagingPlatformControlsIGContract;
}

export interface PackagingInstagramContract {
  caption?: string;
  hashtags?: string[];
  link?: string;
  utm?: PackagingUtmContract;
  slideOrder?: PackagingSlideOrderContract;
  /**
   * #147 (PKG-1): strategy + mood. Replaces the prior track-picker
   * `audio?: PackagingAudioTrackContract` slot. Legacy data is
   * projected into this shape at content-state normalization time.
   */
  audioPlanning?: PackagingAudioPlanningContract;
  /**
   * Cover image filename / placeholder reference. Today we capture the
   * chosen file's NAME (or a stub AI-generated reference) for visual
   * continuity in the Media Selections card. Mirrors the prototype's
   * `pkg.coverAsset` in PackagingStudio.tsx.
   */
  coverAsset?: string;
  /**
   * Resolvable URL for the cover image (data: URL today via FileReader,
   * https:// AgenticFilesystem URL once real persistence lands). Used as
   * the <img src> in the Post Preview card. Kept separate from
   * coverAsset so the filename can remain user-facing for display while
   * the URL backs the actual image render.
   */
  coverAssetUrl?: string;
  // ── Publish Settings — Metadata (IG) ──────────────────────────────
  // Mirrors prototype's pkg.igPeopleTags / igProductTags / igReelsCoverTag.
  peopleTags?: string[];
  productTags?: string[];
  reelsCoverTag?: string;
  platformControls?: PackagingPlatformControlsContract;
}

export interface PackagingTikTokContract {
  caption?: string;
  hashtags?: string[];
  link?: string;
  utm?: PackagingUtmContract;
  /** #147: see PackagingAudioPlanningContract. */
  audioPlanning?: PackagingAudioPlanningContract;
  platformControls?: PackagingPlatformControlsContract;
}

export interface PackagingYouTubeContract {
  title?: string;       // required for VIDEO_LONG_HORIZONTAL
  description?: string;
  tags?: string[];      // keywords / SEO tags
  categoryId?: string;  // YOUTUBE_CATEGORIES lookup key
  thumbnailRef?: string;
  platformControls?: PackagingPlatformControlsContract;
}

export interface PackagingLinkedInContract {
  caption?: string;
  hashtags?: string[];
  link?: string;
  utm?: PackagingUtmContract;
  platformControls?: PackagingPlatformControlsContract;
}

export interface PackagingFacebookContract {
  caption?: string;
  hashtags?: string[];
  link?: string;
  utm?: PackagingUtmContract;
  slideOrder?: PackagingSlideOrderContract;
  /** #147: see PackagingAudioPlanningContract. */
  audioPlanning?: PackagingAudioPlanningContract;
  platformControls?: PackagingPlatformControlsContract;
}

export interface PackagingXContract {
  caption?: string;       // 280 char hard cap
  hashtags?: string[];    // inline # convention, no bank
  keywords?: string[];    // optional SEO/topic keywords
  link?: string;
  utm?: PackagingUtmContract;
  platformControls?: PackagingPlatformControlsContract;
}

export interface ProductionPackagingContract {
  platform?: PlatformContract;
  instagram?: PackagingInstagramContract;
  tiktok?: PackagingTikTokContract;
  youtube?: PackagingYouTubeContract;
  linkedin?: PackagingLinkedInContract;
  facebook?: PackagingFacebookContract;
  x?: PackagingXContract;
}

// ── Production QA / Approve & Schedule contracts (#124) ─────────────
//
// Persistence payload for the Approve & Schedule step. Lives alongside
// brief/draft/packaging on ProductionContract. Approvals are an
// ordered list of approver entries; each entry tracks its own status
// and optional note. PublishConfig captures publish-action choice,
// schedule datetime, visibility, and delivery preferences. All fields
// are optional — sensible defaults are provided by the store computeds.

export type ApprovalStatusContract = 'pending' | 'approved' | 'changes-requested';

export interface ApprovalEntryContract {
  role: string;
  label: string;
  required: boolean;
  status: ApprovalStatusContract;
  note?: string;
  timestamp?: string;
}

export type PublishActionContract =
  | 'save-draft'
  | 'schedule'
  | 'publish-now'
  | 'export-packet';

export type PublishVisibilityContract = 'public' | 'unlisted' | 'private';

export type DeliveryMethodContract = 'auto' | 'manual';

export interface PublishConfigContract {
  publishAction?: PublishActionContract;
  visibility?: PublishVisibilityContract;
  madeForKids?: boolean;
  accountId?: string;
  deliveryMethod?: DeliveryMethodContract;
  notifyTeam?: boolean;
  notifyFollowers?: boolean;
}

export interface ProductionQAContract {
  approvals?: ApprovalEntryContract[];
  approved?: boolean;
  qaApprovedAt?: string;
  qaApprovedBy?: string;
  publishConfig?: PublishConfigContract;
}

export interface ProductionContract {
  productionStep?: ProductionStepContract;
  brief?: ProductionBriefContract;
  draft?: ProductionDraftContract;
  packaging?: ProductionPackagingContract;
  qa?: ProductionQAContract;
  outputs?: Record<string, unknown>;
  sources?: ProductionSourceContract[];
  assets?: ProductionAssetContract[];
  tasks?: ProductionTaskContract[];
  versions?: ProductionVersionContract[];
}

export interface MilestoneOverrideContract {
  /** Full ISO timestamp. Stored as midnight UTC (T00:00:00.000Z) on the chosen date. */
  dueAt: string;
}

/**
 * #146: post-publish performance metrics. All fields optional. The
 * Performance card on the Published detail screen renders only the
 * rows applicable to the post's platform (per spec §6 table).
 */
export interface ContentMetricsContract {
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  /** 0..1 fractional engagement rate; rendered as a percentage. */
  engagementRate?: number;
  reach?: number;
  impressions?: number;
  /** Seconds — only meaningful for YouTube long-form. */
  watchTime?: number;
}

export interface ContentItemContract {
  id: string;
  conceptId?: string;
  stage: ContentStageContract;
  status: ContentStatusContract;
  title: string;
  description: string;
  pillarIds: string[];
  segmentIds: string[];
  objectiveId?: string;
  contentCategory?: string;
  hook?: string;
  objective?: ContentObjectiveContract;
  owner?: string | null;
  platform?: PlatformContract | null;
  contentType?: ContentTypeContract | null;
  keyMessage?: string;
  tonePreset?: TonePresetContract;
  cta?: ContentCtaContract;
  sourceUrl?: string;
  attachments?: ContentAttachmentContract[];
  parentIdeaId?: string | null;
  parentConceptId?: string | null;
  targetPlatforms?: TargetPlatformContract[];
  angle?: string;
  formatNotes?: string[];
  claimsFlag?: boolean;
  sourceLinks?: string[];
  riskLevel?: RiskLevelContract;
  targetPublishWindow?: TargetPublishWindowContract;
  scheduledAt?: string | null;
  /**
   * #140 (Publish Flow): ISO 8601 timestamp set when a post transitions
   * to `status: 'published'`. Source paths:
   *  - Publish Now → set at Finish click.
   *  - Export Packet (no date) → set at Finish click.
   *  - Auto-transition → set to the transition timestamp when a
   *    `scheduled` post crosses its `scheduledAt`.
   *
   * Stays unset on a `published` legacy item; the Calendar silently
   * skips events for such items (no fallback).
   */
  publishedAt?: string;
  /**
   * #140: `true` when the post was finished via the Export Packet
   * action. Drives the gray "Exported" pill on pipeline cards,
   * card detail screen, and calendar events. Preserved across the
   * Scheduled → Published auto-transition.
   */
  isExported?: boolean;
  /**
   * #140: Live URL of the published post. Auto-set to a mock URL on
   * Publish Now (pattern: `https://www.<platform>.com/p/mock-<id>/`).
   * Stays unset on Export Packet finish until the user pastes the real
   * URL in the Published-detail screen (delivered in #146).
   */
  livePostUrl?: string;
  /**
   * #146: per-platform performance metrics surfaced on the Published
   * detail screen's Performance card. All fields optional; the card
   * renders `0` for explicit-zero values and the empty-state copy
   * when the entire object is undefined. Future work wires real
   * platform-API pulls (see #146 spec §6 Open Items).
   */
  metrics?: ContentMetricsContract;
  /**
   * Per-item milestone date overrides keyed by milestone type. Each entry
   * is an exception to the workspace deadline template at
   * `settings/calendar.json`. The template stays untouched; rendering code
   * checks for an override first, then falls back to the template's
   * `offsetDays` relative to `scheduledAt`.
   */
  milestoneOverrides?: Partial<Record<MilestoneType, MilestoneOverrideContract>>;
  production?: ProductionContract;
  archived?: boolean;
  tags?: string[];
  briefApproved?: boolean;
  briefApprovedAt?: string;
  briefApprovedBy?: string;
  createdAt: string;
  updatedAt: string;
}
