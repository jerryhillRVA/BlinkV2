export const DISCOVERY_SECTION_IDS = [
  'business',
  'brand_voice',
  'audience',
  'competitors',
  'content',
  'channels',
  'expectations',
] as const;

export type DiscoverySectionId = (typeof DISCOVERY_SECTION_IDS)[number];

export interface DiscoverySectionContract {
  id: DiscoverySectionId;
  name: string;
  covered: boolean;
}

export const DISCOVERY_SECTIONS: readonly DiscoverySectionContract[] = [
  { id: 'business', name: 'Business Overview', covered: false },
  { id: 'brand_voice', name: 'Brand & Voice', covered: false },
  { id: 'audience', name: 'Audience', covered: false },
  { id: 'competitors', name: 'Competitors', covered: false },
  { id: 'content', name: 'Content Strategy', covered: false },
  { id: 'channels', name: 'Channels & Capacity', covered: false },
  { id: 'expectations', name: 'Expectations & Goals', covered: false },
];
