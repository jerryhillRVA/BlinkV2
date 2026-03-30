import type { DiscoverySectionContract, DiscoverySectionId } from './discovery-section.js';
import type { OnboardingMessageContract } from './onboarding-message.js';

export type OnboardingSessionStatus =
  | 'active'
  | 'generating'
  | 'complete'
  | 'abandoned';

export interface CreateSessionRequestContract {
  businessName?: string;
  websiteUrl?: string;
}

export interface CreateSessionResponseContract {
  sessionId: string;
  status: 'active';
  initialMessage: string;
  sections: DiscoverySectionContract[];
}

export interface SendMessageRequestContract {
  content: string;
}

export interface SendMessageResponseContract {
  agentMessage: string;
  sections: DiscoverySectionContract[];
  currentSection: DiscoverySectionId;
  readyToGenerate: boolean;
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
  audienceProfiles: BlueprintAudienceContract[];
  competitorLandscape: BlueprintCompetitorContract[];
  contentPillars: BlueprintPillarContract[];
  channelsAndCadence: BlueprintChannelContract[];
  performanceScorecard: BlueprintMetricContract[];
  quickWins: string[];
}
