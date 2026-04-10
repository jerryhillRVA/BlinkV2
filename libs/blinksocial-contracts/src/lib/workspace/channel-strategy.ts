export interface ChannelStrategyEntryContract {
  platform: string;
  active: boolean;
  role: string;
  primaryContentTypes: string[];
  toneAdjustment: string;
  postingCadence: string;
  primaryAudience: string;
  primaryGoal: string;
  notes: string;
}

export interface ChannelStrategySettingsContract {
  channels: ChannelStrategyEntryContract[];
}
