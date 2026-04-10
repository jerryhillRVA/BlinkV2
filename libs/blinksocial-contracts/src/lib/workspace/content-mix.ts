export interface ContentMixTargetContract {
  category: string;
  label: string;
  targetPercent: number;
  color: string;
  description: string;
}

export interface ContentMixSettingsContract {
  targets: ContentMixTargetContract[];
}
