import type { DiscoverySectionContract, DiscoverySectionId } from './discovery-section.js';
import type {
  OnboardingMessageContract,
  OnboardingAttachmentContract,
} from './onboarding-message.js';
import type { CreateWorkspaceRequestContract } from '../workspace/create-workspace-request.js';

export type OnboardingSessionStatus =
  | 'active'
  | 'generating'
  | 'complete'
  | 'abandoned';

export interface CreateSessionRequestContract {
  workspaceName: string;
  businessName?: string;
  websiteUrl?: string;
}

export interface CreateSessionResponseContract {
  sessionId: string;
  workspaceId: string;
  status: 'active';
  initialMessage: string;
  sections: DiscoverySectionContract[];
}

/**
 * Sent on the JSON path. The multipart path uses the same field names as
 * form fields plus repeatable `files` parts (see
 * `POST /api/onboarding/sessions/:id/messages`).
 */
export interface SendMessageRequestContract {
  content: string;
}

export interface SendMessageResponseContract {
  agentMessage: string;
  sections: DiscoverySectionContract[];
  currentSection: DiscoverySectionId;
  readyToGenerate: boolean;
  /**
   * Canonical persisted attachment records for the just-sent user message.
   * Present when files were uploaded — lets the FE swap optimistic chips
   * for server-assigned ids/fileIds.
   */
  messageAttachments?: OnboardingAttachmentContract[];
  /**
   * Set to `true` by the agent when the user has confirmed a revision plan
   * after the Blueprint was first generated. The frontend treats this as a
   * signal to immediately re-invoke `generateBlueprint`, mirroring the
   * `readyToGenerate` pattern used at the end of discovery.
   *
   * Only meaningful while the session is in `complete` status (post-generation
   * revision flow). Absent or `false` in all other turns.
   */
  readyToRevise?: boolean;
}

export interface GetSessionResponseContract {
  sessionId: string;
  status: OnboardingSessionStatus;
  messages: OnboardingMessageContract[];
  sections: DiscoverySectionContract[];
  currentSection: DiscoverySectionId;
  readyToGenerate: boolean;
  blueprint: BlueprintDocumentContract | null;
}

export interface GenerateBlueprintResponseContract {
  blueprint: BlueprintDocumentContract;
  markdownDocument: string;
}

/**
 * Stable placeholder string the LLM must emit (and `renderBlueprintMarkdown`
 * passes through unchanged) whenever a discovery answer was blank but the
 * Blueprint subsection is still required for structural completeness.
 *
 * Length deliberately exceeds the schema's 30-char `minLength` so it can
 * legally satisfy any required-string field. See ticket #71.
 */
export const BLUEPRINT_BLANK_PLACEHOLDER =
  '*Not provided during discovery — capture in next session*';

export interface BlueprintJourneyStageContract {
  /** Canonical journey stages — order is preserved in rendered output. */
  phase: 'Discovery' | 'Consideration' | 'Conversion' | 'Advocate';
  /** What the audience is trying to do at this phase. */
  goal: string;
  /** Which content type / pillar meets them at this moment. */
  contentMoment: string;
}

export interface BlueprintVoiceExampleContract {
  /** Where this sample would appear (e.g. "Caption: workout reel"). */
  context: string;
  /** Sample copy in-voice — 1–3 sentences. */
  sample: string;
}

export interface BlueprintDifferentiationCellContract {
  name: string;
  value: string;
}

export interface BlueprintDifferentiationRowContract {
  /** Comparison dimension (e.g. "Audience specificity"). */
  dimension: string;
  /** Hive's value on this dimension. */
  hive: string;
  /** One cell per competitor compared. */
  competitors: BlueprintDifferentiationCellContract[];
}

export interface BlueprintContentIdeaContract {
  /** Working title or hook line for the post. */
  title: string;
  /** One-line angle / framing of the idea. */
  angle: string;
}

export interface BlueprintChannelMatrixPlacementContract {
  channel: string;
  role: 'primary' | 'occasional';
}

export interface BlueprintChannelMatrixRowContract {
  /** Pillar name — must match a `contentPillars[].name`. */
  pillar: string;
  /** Channel placements for this pillar. */
  placements: BlueprintChannelMatrixPlacementContract[];
}

export interface BlueprintObjectiveContract {
  objective: string;
  category: string;
  timeHorizon: string;
  metric: string;
}

export interface BlueprintAudienceContract {
  name: string;
  demographics: string;
  painPoints: string[];
  channels: string[];
  contentHook: string;
  /**
   * Per-segment journey map (Discovery → Consideration → Conversion →
   * Advocate). Always exactly 4 stages in canonical order.
   */
  journeyMap: BlueprintJourneyStageContract[];
}

export interface BlueprintCompetitorContract {
  name: string;
  platforms: string[];
  strengths: string[];
  gaps: string[];
  relevancy: string;
}

export interface BlueprintPillarContract {
  name: string;
  description: string;
  formats: string[];
  sharePercent: number;
  /**
   * "Content Ideas Bank" — concrete working post titles/angles for this
   * pillar. Minimum 5 ideas per pillar; not categories, real ideas.
   */
  contentIdeas: BlueprintContentIdeaContract[];
}

export interface BlueprintChannelContract {
  channel: string;
  role: string;
  frequency: string;
  bestTimes: string;
  contentTypes: string[];
}

export interface BlueprintMetricContract {
  metric: string;
  baseline: string;
  thirtyDayTarget: string;
  ninetyDayTarget: string;
  /** Plain-language definition of what this metric measures. */
  definition: string;
}

export interface BlueprintDocumentContract {
  clientName: string;
  deliveredDate: string;
  strategicSummary: string;
  /** "The Strategy in Plain English" subsection — short prose. */
  strategyInPlainEnglish: string;
  /** "Strategic Decisions Made in the Discovery Session" subsection. */
  strategicDecisions: string;
  businessObjectives: BlueprintObjectiveContract[];
  /** "How These Objectives Shape Content" subsection. */
  objectivesShapeContent: string;
  brandVoice: {
    positioningStatement: string;
    contentMission: string;
    voiceAttributes: { attribute: string; description: string }[];
    doList: string[];
    dontList: string[];
    /**
     * "Voice in Action — Real Copy Examples" subsection. Sample copy that
     * calibrates briefs/captions/copy reviews. Min 3 examples.
     */
    voiceInAction: BlueprintVoiceExampleContract[];
  };
  targetAudience: string;
  audienceProfiles: BlueprintAudienceContract[];
  competitorLandscape: BlueprintCompetitorContract[];
  /**
   * "Differentiation Matrix" — grid comparing Hive against named competitors
   * across competitor-relevant dimensions. Min 3 rows.
   */
  differentiationMatrix: BlueprintDifferentiationRowContract[];
  /** "Differentiation Summary" paragraph following the matrix. */
  differentiationSummary: string;
  contentPillars: BlueprintPillarContract[];
  channelsAndCadence: BlueprintChannelContract[];
  /**
   * "Content-Channel Matrix" — grid showing which pillars go on which
   * platforms with primary/occasional indicators. Must contain one row
   * per content pillar (cross-field guard enforced server-side).
   */
  contentChannelMatrix: BlueprintChannelMatrixRowContract[];
  performanceScorecard: BlueprintMetricContract[];
  /** "Review Cadence" — when and how to review the scorecard. */
  reviewCadence: string;
  quickWins: string[];
}

export interface CreateWorkspaceFromBlueprintResponseContract {
  workspaceId: string;
  tenantId: string;
  wizardData: CreateWorkspaceRequestContract;
}
