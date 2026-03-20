import type {
  Platform,
  ContentType,
  AssetChecklistItem,
  ResearchSource,
  ProductionStep,
} from "../types";

// Which Draft Studio tabs are visible per content type
export interface ContentTypeConfig {
  label: string;
  category: "video-long" | "video-short" | "image" | "carousel" | "story" | "live" | "text";
  tabs: ("script" | "shot-plan" | "slide-plan" | "frame-plan" | "metadata")[];
  requiresSource: boolean; // always require source
  sourceConditional: boolean; // require source if claims-based
  hasBeatSheet: boolean;
  hasHookBank: boolean;
  hookBankCount: number;
  defaultAssets: Omit<AssetChecklistItem, "id">[];
  dimensions?: string;
}

export const CONTENT_TYPE_CONFIG: Record<ContentType, ContentTypeConfig> = {
  // YouTube
  "long-form": {
    label: "YouTube Long-form",
    category: "video-long",
    tabs: ["script", "shot-plan", "metadata"],
    requiresSource: false,
    sourceConditional: true,
    hasBeatSheet: false,
    hasHookBank: true,
    hookBankCount: 3,
    defaultAssets: [
      { label: "A-roll footage", required: true, completed: false },
      { label: "B-roll footage", required: false, completed: false },
      { label: "Screen recordings", required: false, completed: false },
      { label: "Brand intro/outro", required: true, completed: false },
      { label: "Music licenses", required: false, completed: false },
      { label: "Captions file", required: true, completed: false },
      { label: "Thumbnail PNG/PSD", required: true, completed: false },
    ],
    dimensions: "1920x1080",
  },
  shorts: {
    label: "YouTube Shorts",
    category: "video-short",
    tabs: ["script"],
    requiresSource: false,
    sourceConditional: true,
    hasBeatSheet: true,
    hasHookBank: true,
    hookBankCount: 5,
    defaultAssets: [
      { label: "Vertical video (9:16)", required: true, completed: false },
      { label: "Captions overlay", required: true, completed: false },
      { label: "Cover still frame", required: false, completed: false },
    ],
    dimensions: "1080x1920",
  },
  "live-stream": {
    label: "YouTube Live",
    category: "live",
    tabs: ["script"],
    requiresSource: false,
    sourceConditional: false,
    hasBeatSheet: false,
    hasHookBank: false,
    hookBankCount: 0,
    defaultAssets: [
      { label: "Stream overlay graphics", required: false, completed: false },
      { label: "Talking points doc", required: true, completed: false },
      { label: "Waiting screen", required: false, completed: false },
    ],
    dimensions: "1920x1080",
  },
  "community-post": {
    label: "YouTube Community Post",
    category: "text",
    tabs: ["script"],
    requiresSource: false,
    sourceConditional: false,
    hasBeatSheet: false,
    hasHookBank: false,
    hookBankCount: 0,
    defaultAssets: [
      { label: "Post image (optional)", required: false, completed: false },
    ],
  },
  // Instagram
  reel: {
    label: "Instagram Reel",
    category: "video-short",
    tabs: ["script"],
    requiresSource: false,
    sourceConditional: true,
    hasBeatSheet: true,
    hasHookBank: true,
    hookBankCount: 5,
    defaultAssets: [
      { label: "Vertical video (9:16)", required: true, completed: false },
      { label: "Cover still", required: true, completed: false },
      { label: "Audio/music selection", required: false, completed: false },
      { label: "Captions overlay", required: true, completed: false },
    ],
    dimensions: "1080x1920",
  },
  carousel: {
    label: "Instagram Carousel",
    category: "carousel",
    tabs: ["script"],
    requiresSource: false,
    sourceConditional: true,
    hasBeatSheet: false,
    hasHookBank: false,
    hookBankCount: 0,
    defaultAssets: [
      { label: "Slide images (1080x1080 or 1080x1350)", required: true, completed: false },
      { label: "Brand font/logo", required: false, completed: false },
    ],
    dimensions: "1080x1350",
  },
  "feed-post": {
    label: "Instagram Post",
    category: "image",
    tabs: ["script"],
    requiresSource: false,
    sourceConditional: true,
    hasBeatSheet: false,
    hasHookBank: false,
    hookBankCount: 0,
    defaultAssets: [
      { label: "Post image (1080x1080 or 1080x1350)", required: true, completed: false },
      { label: "Brand logo (if needed)", required: false, completed: false },
    ],
    dimensions: "1080x1080",
  },
  story: {
    label: "Instagram Stories",
    category: "story",
    tabs: ["script", "frame-plan"],
    requiresSource: false,
    sourceConditional: false,
    hasBeatSheet: false,
    hasHookBank: false,
    hookBankCount: 0,
    defaultAssets: [
      { label: "Story frames (1080x1920)", required: true, completed: false },
      { label: "Link/URL (if CTA)", required: false, completed: false },
    ],
    dimensions: "1080x1920",
  },
  guide: {
    label: "Instagram Guide",
    category: "text",
    tabs: ["script"],
    requiresSource: false,
    sourceConditional: false,
    hasBeatSheet: false,
    hasHookBank: false,
    hookBankCount: 0,
    defaultAssets: [
      { label: "Cover image", required: true, completed: false },
      { label: "Referenced posts", required: true, completed: false },
    ],
  },
  live: {
    label: "Instagram Live",
    category: "live",
    tabs: ["script"],
    requiresSource: false,
    sourceConditional: false,
    hasBeatSheet: false,
    hasHookBank: false,
    hookBankCount: 0,
    defaultAssets: [
      { label: "Talking points doc", required: true, completed: false },
    ],
  },
  // TikTok
  "short-video": {
    label: "TikTok Video",
    category: "video-short",
    tabs: ["script"],
    requiresSource: false,
    sourceConditional: true,
    hasBeatSheet: true,
    hasHookBank: true,
    hookBankCount: 7,
    defaultAssets: [
      { label: "Vertical video (9:16)", required: true, completed: false },
      { label: "On-screen text overlays", required: true, completed: false },
      { label: "Cover still (optional)", required: false, completed: false },
    ],
    dimensions: "1080x1920",
  },
  // TikTok Photo Carousel
  "photo-carousel": {
    label: "TikTok Photo Carousel",
    category: "carousel",
    tabs: ["script"],
    requiresSource: false,
    sourceConditional: true,
    hasBeatSheet: false,
    hasHookBank: false,
    hookBankCount: 0,
    defaultAssets: [
      { label: "Slide images (9:16)", required: true, completed: false },
      { label: "Cover image", required: true, completed: false },
    ],
    dimensions: "1080x1920",
  },
  // Facebook
  "fb-link-post": {
    label: "Facebook Link Post",
    category: "text",
    tabs: ["script"],
    requiresSource: false,
    sourceConditional: false,
    hasBeatSheet: false,
    hasHookBank: false,
    hookBankCount: 0,
    defaultAssets: [
      { label: "Custom preview image (1200x630)", required: false, completed: false },
    ],
  },
  "fb-feed-post": {
    label: "Facebook Feed Post",
    category: "image",
    tabs: ["script"],
    requiresSource: false,
    sourceConditional: false,
    hasBeatSheet: false,
    hasHookBank: false,
    hookBankCount: 0,
    defaultAssets: [
      { label: "Post image", required: true, completed: false },
    ],
  },
  "fb-live": {
    label: "Facebook Live",
    category: "live",
    tabs: ["script"],
    requiresSource: false,
    sourceConditional: false,
    hasBeatSheet: false,
    hasHookBank: false,
    hookBankCount: 0,
    defaultAssets: [
      { label: "Thumbnail image", required: true, completed: false },
      { label: "Talking points doc", required: true, completed: false },
      { label: "Overlay/lower-third graphics", required: false, completed: false },
      { label: "Waiting screen graphic", required: false, completed: false },
    ],
    dimensions: "1920x1080",
  },
  "fb-reel": {
    label: "Facebook Reel",
    category: "video-short",
    tabs: ["script"],
    requiresSource: false,
    sourceConditional: true,
    hasBeatSheet: true,
    hasHookBank: true,
    hookBankCount: 5,
    defaultAssets: [
      { label: "Vertical video (9:16)", required: true, completed: false },
      { label: "Cover still", required: false, completed: false },
      { label: "Captions overlay", required: true, completed: false },
    ],
    dimensions: "1080x1920",
  },
  "fb-story": {
    label: "Facebook Story",
    category: "story",
    tabs: ["script", "frame-plan"],
    requiresSource: false,
    sourceConditional: false,
    hasBeatSheet: false,
    hasHookBank: false,
    hookBankCount: 0,
    defaultAssets: [
      { label: "Story frames (1080x1920)", required: true, completed: false },
    ],
    dimensions: "1080x1920",
  },
  // LinkedIn
  "ln-text-post": {
    label: "LinkedIn Text Post",
    category: "text",
    tabs: ["script"],
    requiresSource: false,
    sourceConditional: false,
    hasBeatSheet: false,
    hasHookBank: false,
    hookBankCount: 0,
    defaultAssets: [],
  },
  "ln-document": {
    label: "LinkedIn Document",
    category: "carousel",
    tabs: ["script"],
    requiresSource: false,
    sourceConditional: true,
    hasBeatSheet: false,
    hasHookBank: false,
    hookBankCount: 0,
    defaultAssets: [
      { label: "PDF document", required: true, completed: false },
      { label: "Cover page design", required: true, completed: false },
    ],
  },
  "ln-article": {
    label: "LinkedIn Article",
    category: "text",
    tabs: ["script"],
    requiresSource: false,
    sourceConditional: true,
    hasBeatSheet: false,
    hasHookBank: false,
    hookBankCount: 0,
    defaultAssets: [
      { label: "Header image", required: true, completed: false },
    ],
  },
  "ln-video": {
    label: "LinkedIn Video",
    category: "video-short",
    tabs: ["script"],
    requiresSource: false,
    sourceConditional: true,
    hasBeatSheet: false,
    hasHookBank: true,
    hookBankCount: 3,
    defaultAssets: [
      { label: "Video file", required: true, completed: false },
      { label: "Captions file", required: true, completed: false },
      { label: "Thumbnail", required: false, completed: false },
    ],
  },
};

// Claims-based content types that conditionally require sources
export const CLAIMS_CONTENT_LABELS = [
  "thought leadership",
  "news",
  "educational",
  "claims-based",
  "data-based",
];

export const OBJECTIVE_OPTIONS: { value: string; label: string }[] = [
  { value: "awareness", label: "Awareness" },
  { value: "lead-gen", label: "Lead Generation" },
  { value: "trust", label: "Trust Building" },
  { value: "education", label: "Education" },
  { value: "conversion", label: "Conversion" },
];

export const CTA_OPTIONS: { value: string; label: string }[] = [
  { value: "follow", label: "Follow" },
  { value: "link", label: "Link Click" },
  { value: "comment", label: "Comment" },
  { value: "share", label: "Share" },
  { value: "subscribe", label: "Subscribe" },
  { value: "swipe", label: "Swipe Up" },
  { value: "dm", label: "DM" },
  { value: "none", label: "No CTA" },
];

export const TONE_OPTIONS: { value: string; label: string }[] = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "bold", label: "Bold" },
  { value: "empathetic", label: "Empathetic" },
  { value: "educational", label: "Educational" },
  { value: "playful", label: "Playful" },
];

export const HOOK_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "pattern-break", label: "Pattern Break" },
  { value: "problem-first", label: "Problem First" },
  { value: "outcome-first", label: "Outcome First" },
  { value: "story-first", label: "Story First" },
  { value: "question", label: "Question" },
];

export const VIDEO_STYLE_OPTIONS: { value: string; label: string }[] = [
  { value: "talking-head", label: "Talking Head" },
  { value: "interview", label: "Interview" },
  { value: "tutorial", label: "Tutorial" },
  { value: "b-roll-montage", label: "B-roll Montage" },
  { value: "text-only", label: "Text Only" },
  { value: "duet-style", label: "Duet Style" },
  { value: "screen-recording", label: "Screen Recording" },
];

export const STORY_ARC_OPTIONS: { value: string; label: string }[] = [
  { value: "hook-promise-sections-recap-cta", label: "Hook > Promise > Sections > Recap > CTA" },
  { value: "problem-solution", label: "Problem > Solution" },
  { value: "listicle", label: "Listicle" },
  { value: "narrative", label: "Narrative Arc" },
  { value: "before-after", label: "Before > After" },
];

export const CAROUSEL_GOAL_OPTIONS: { value: string; label: string }[] = [
  { value: "teach", label: "Teach" },
  { value: "convert", label: "Convert" },
  { value: "story", label: "Story" },
  { value: "proof", label: "Social Proof" },
];

export const POST_INTENT_OPTIONS: { value: string; label: string }[] = [
  { value: "announcement", label: "Announcement" },
  { value: "quote", label: "Quote" },
  { value: "stat", label: "Statistic" },
  { value: "product", label: "Product" },
  { value: "meme", label: "Meme" },
  { value: "event", label: "Event" },
];

export const INTERACTION_OPTIONS: { value: string; label: string }[] = [
  { value: "poll", label: "Poll" },
  { value: "question", label: "Question" },
  { value: "link", label: "Link" },
  { value: "quiz", label: "Quiz" },
  { value: "none", label: "None" },
];

export const TEAM_ROLES = [
  "Strategist",
  "Writer",
  "On-camera",
  "Editor",
  "Designer",
  "Approver",
];

// Blueprint options for Carousel
export const NARRATIVE_PATTERN_OPTIONS: { value: string; label: string }[] = [
  { value: "hook-teach-expand-cta", label: "Hook → Teach → Expand → CTA" },
  { value: "problem-agitate-solve-cta", label: "Problem → Agitate → Solve → CTA" },
  { value: "listicle", label: "Listicle (X Tips)" },
  { value: "framework", label: "Framework Breakdown" },
  { value: "case-study", label: "Case Study" },
  { value: "before-after", label: "Before/After" },
  { value: "custom", label: "Custom" },
];

export const SLIDE_ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: "hook", label: "Hook" },
  { value: "value", label: "Value" },
  { value: "proof", label: "Proof" },
  { value: "expansion", label: "Expansion" },
  { value: "cta", label: "CTA" },
  { value: "transition", label: "Transition" },
];

export const HOOK_TYPE_CAROUSEL_OPTIONS: { value: string; label: string }[] = [
  { value: "bold-claim", label: "Bold Claim" },
  { value: "curiosity-gap", label: "Curiosity Gap" },
  { value: "contrarian", label: "Contrarian Take" },
  { value: "specific-outcome", label: "Specific Outcome" },
  { value: "question", label: "Question" },
  { value: "data-stat", label: "Data/Stat" },
];

export const CTA_TYPE_CAROUSEL_OPTIONS: { value: string; label: string }[] = [
  { value: "follow", label: "Follow" },
  { value: "comment", label: "Comment" },
  { value: "save", label: "Save" },
  { value: "link-bio", label: "Visit Link in Bio" },
  { value: "dm", label: "DM" },
  { value: "product", label: "Product" },
];

export const PRODUCTION_STEPS: { id: ProductionStep; label: string; step: number }[] = [
  { id: "brief", label: "Brief", step: 1 },
  { id: "builder", label: "Builder", step: 2 },
  { id: "packaging", label: "Packaging", step: 3 },
  { id: "qa", label: "QA", step: 4 },
];

// Export MOCK_RESEARCH_SOURCES
export const MOCK_RESEARCH_SOURCES: ResearchSource[] = [];