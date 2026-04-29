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
}

export interface BlueprintDocumentContract {
  clientName: string;
  deliveredDate: string;
  strategicSummary: string;
  businessObjectives: BlueprintObjectiveContract[];
  brandVoice: {
    positioningStatement: string;
    contentMission: string;
    voiceAttributes: { attribute: string; description: string }[];
    doList: string[];
    dontList: string[];
  };
  targetAudience: string;
  audienceProfiles: BlueprintAudienceContract[];
  competitorLandscape: BlueprintCompetitorContract[];
  contentPillars: BlueprintPillarContract[];
  channelsAndCadence: BlueprintChannelContract[];
  performanceScorecard: BlueprintMetricContract[];
  quickWins: string[];
}

export interface CreateWorkspaceFromBlueprintResponseContract {
  workspaceId: string;
  tenantId: string;
  wizardData: CreateWorkspaceRequestContract;
}
