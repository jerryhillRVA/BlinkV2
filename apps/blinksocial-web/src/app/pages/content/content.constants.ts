import type {
  SidebarStep,
  PipelineColumn,
  ContentStage,
  ContentStatus,
  CtaType,
  TonePreset,
  ContentObjective,
  Platform,
  ContentType,
  ContentItemType,
} from './content.types';

export const AI_SIMULATION_DELAY_MS = 2500;
export const AI_ASSIST_DELAY_MS = 1500;

export interface ContentTypeOption {
  value: ContentItemType;
  label: string;
  description: string;
  iconPaths: string[];
  iconColor: string;
}

// Lucide icon paths for each item type (mirrors figma prototype)
export const CONTENT_TYPE_OPTIONS: ContentTypeOption[] = [
  {
    value: 'idea',
    label: 'Idea',
    description: 'A spark to explore later',
    iconColor: '#3b82f6', // blue-500
    // Lucide Lightbulb
    iconPaths: [
      'M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5',
      'M9 18h6',
      'M10 22h4',
    ],
  },
  {
    value: 'concept',
    label: 'Concept',
    description: 'A shaped post ready for review',
    iconColor: '#a855f7', // purple-500
    // Lucide Send
    iconPaths: [
      'M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z',
      'M21.854 2.147l-10.94 10.939',
    ],
  },
  {
    value: 'production-brief',
    label: 'Production Brief',
    description: 'Detailed plan for asset creation',
    iconColor: '#f97316', // orange-500
    // Lucide FileText
    iconPaths: [
      'M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z',
      'M14 2v4a2 2 0 0 0 2 2h4',
      'M10 9H8',
      'M16 13H8',
      'M16 17H8',
    ],
  },
];

export const OBJECTIVE_OPTIONS: { value: ContentObjective; label: string }[] = [
  { value: 'awareness', label: 'Awareness' },
  { value: 'engagement', label: 'Engagement' },
  { value: 'trust', label: 'Trust' },
  { value: 'leads', label: 'Leads' },
  { value: 'conversion', label: 'Conversion' },
];

export const PLATFORM_OPTIONS: { value: Platform; label: string }[] = [
  { value: 'tbd', label: 'TBD' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'linkedin', label: 'LinkedIn' },
];

export const PLATFORM_CONTENT_TYPES: Record<Platform, { value: ContentType; label: string }[]> = {
  tbd: [],
  instagram: [
    { value: 'reel', label: 'Reel' },
    { value: 'carousel', label: 'Carousel' },
    { value: 'feed-post', label: 'Feed Post' },
    { value: 'story', label: 'Story' },
    { value: 'guide', label: 'Guide' },
    { value: 'live', label: 'Live' },
  ],
  youtube: [
    { value: 'short-video', label: 'Short' },
    { value: 'long-form', label: 'Long-form Video' },
    { value: 'shorts', label: 'Shorts' },
    { value: 'live-stream', label: 'Live Stream' },
    { value: 'community-post', label: 'Community Post' },
  ],
  tiktok: [
    { value: 'short-video', label: 'Short Video' },
    { value: 'photo-carousel', label: 'Photo Carousel' },
    { value: 'live-stream', label: 'Live Stream' },
  ],
  facebook: [
    { value: 'fb-feed-post', label: 'Feed Post' },
    { value: 'fb-link-post', label: 'Link Post' },
    { value: 'fb-reel', label: 'Reel' },
    { value: 'fb-story', label: 'Story' },
    { value: 'fb-live', label: 'Live' },
  ],
  linkedin: [
    { value: 'ln-text-post', label: 'Text Post' },
    { value: 'ln-document', label: 'Document' },
    { value: 'ln-article', label: 'Article' },
    { value: 'ln-video', label: 'Video' },
  ],
};

export const CTA_TYPES: { value: CtaType; label: string }[] = [
  { value: 'learn-more', label: 'Learn More' },
  { value: 'subscribe', label: 'Subscribe' },
  { value: 'comment', label: 'Comment' },
  { value: 'download', label: 'Download' },
  { value: 'buy', label: 'Buy' },
  { value: 'book-call', label: 'Book a Call' },
  { value: 'other', label: 'Other' },
];

export const TONE_PRESETS: { value: TonePreset; label: string }[] = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'authoritative', label: 'Authoritative' },
  { value: 'inspiring', label: 'Inspiring' },
  { value: 'playful', label: 'Playful' },
];

export const DESCRIPTION_MIN_CHARS = 50;
export const DESCRIPTION_MAX_CHARS = 400;
export const HOOK_MAX_CHARS = 120;
export const CTA_TEXT_MAX_CHARS = 120;
export const KEY_MESSAGE_MAX_CHARS = 140;
export const MAX_PILLARS_PER_ITEM = 3;
export const MAX_FOCUS_PILLARS = 2;
export const GENERATED_IDEAS_COUNT = 6;

// Lucide icon SVG paths for sidebar steps
export const WORKFLOW_STEPS: SidebarStep[] = [
  {
    id: 'overview',
    label: 'Overview',
    step: 1,
    // LayoutGrid icon
    iconPath: 'M3 3h7v7H3V3zm11 0h7v7h-7V3zm0 11h7v7h-7v-7zM3 14h7v7H3v-7z',
  },
  {
    id: 'strategy',
    label: 'Strategy',
    step: 2,
    // Target icon
    iconPath: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 4a6 6 0 1 1 0 12 6 6 0 0 1 0-12zm0 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
  },
  {
    id: 'production',
    label: 'Production',
    step: 3,
    // PenTool icon
    iconPath: 'M12 19l7-7 3 3-7 7-3-3z M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z M2 2l7.586 7.586',
  },
  {
    id: 'review',
    label: 'Review',
    step: 4,
    // ShieldCheck icon
    iconPath: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z M9 12l2 2 4-4',
  },
  {
    id: 'performance',
    label: 'Performance',
    step: 5,
    // BarChart3 icon
    iconPath: 'M3 3v18h18 M18 17V9 M13 17V5 M8 17v-3',
  },
];

export const STAGE_CONFIG: Record<ContentStage, { label: string; colorClass: string; dotClass: string }> = {
  idea: { label: 'Idea', colorClass: 'stage-idea', dotClass: 'dot-idea' },
  concept: { label: 'Concept', colorClass: 'stage-concept', dotClass: 'dot-concept' },
  post: { label: 'Post', colorClass: 'stage-post', dotClass: 'dot-post' },
  'production-brief': { label: 'Brief', colorClass: 'stage-brief', dotClass: 'dot-brief' },
};

export const STATUS_CONFIG: Record<ContentStatus, { label: string }> = {
  draft: { label: 'Draft' },
  'in-progress': { label: 'In Progress' },
  review: { label: 'In Review' },
  scheduled: { label: 'Scheduled' },
  published: { label: 'Published' },
};

export const PIPELINE_COLUMNS: PipelineColumn[] = [
  {
    id: 'ideas',
    label: 'Ideas',
    stage: 'idea',
    statuses: ['draft'],
    colorClass: 'column-ideas',
    iconColor: '#3b82f6',
    addType: 'idea',
    // Lucide Lightbulb
    iconPaths: [
      'M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5',
      'M9 18h6',
      'M10 22h4',
    ],
  },
  {
    id: 'concepts',
    label: 'Concepts',
    stage: 'concept',
    statuses: ['draft'],
    colorClass: 'column-concepts',
    iconColor: '#a855f7',
    addType: 'concept',
    // Lucide Send
    iconPaths: [
      'M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z',
      'M21.854 2.147l-10.94 10.939',
    ],
  },
  {
    id: 'in-production',
    label: 'Posts in Production',
    stage: null,
    statuses: ['in-progress'],
    colorClass: 'column-production',
    iconColor: '#eab308',
    addType: 'production-brief',
    // Lucide PenTool
    iconPaths: [
      'M15.707 21.293a1 1 0 0 1-1.414 0l-1.586-1.586a1 1 0 0 1 0-1.414l5.586-5.586a1 1 0 0 1 1.414 0l1.586 1.586a1 1 0 0 1 0 1.414z',
      'M18 13l-1.375-6.874a1 1 0 0 0-.746-.776L3.235 2.028a1 1 0 0 0-1.207 1.207L5.35 15.879a1 1 0 0 0 .776.746L13 18',
      'M2.3 2.3l7.286 7.286',
      'M11 11a2 2 0 1 1-4 0 2 2 0 0 1 4 0z',
    ],
  },
  {
    id: 'review',
    label: 'Review & Schedule',
    stage: null,
    statuses: ['review', 'scheduled'],
    colorClass: 'column-review',
    iconColor: '#ec4899',
    // Lucide ShieldCheck
    iconPaths: [
      'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z',
      'M9 12l2 2 4-4',
    ],
  },
  {
    id: 'published',
    label: 'Published',
    stage: null,
    statuses: ['published'],
    colorClass: 'column-published',
    iconColor: '#10b981',
    // Lucide CheckCircle
    iconPaths: [
      'M22 11.08V12a10 10 0 1 1-5.93-9.14',
      'M22 4 12 14.01l-3-3',
    ],
  },
];
