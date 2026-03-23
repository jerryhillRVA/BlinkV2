export type WorkflowStep = "overview" | "strategy" | "ideation" | "production" | "review" | "performance";
export type ContentStage = "idea" | "concept" | "post" | "production-brief";
export type ContentStatus = "draft" | "in-progress" | "review" | "scheduled" | "published";
export type Platform = "instagram" | "tiktok" | "youtube" | "facebook" | "linkedin" | "tbd";

export type ContentObjective = "awareness" | "engagement" | "traffic" | "leads" | "sales" | "community" | "recruiting" | "lead-gen" | "trust" | "education" | "conversion";
export type CTATypeEnum = "none" | "learn-more" | "subscribe" | "comment" | "download" | "buy" | "book-call" | "other";
export type FormatNote = "talking-head" | "b-roll" | "ugc" | "voiceover" | "interview" | "demo" | "other";
export type RiskLevel = "low" | "medium" | "high";

export type InstagramContentType = "reel" | "carousel" | "feed-post" | "story" | "guide" | "live";
export type FacebookContentType = "fb-link-post" | "fb-feed-post" | "fb-live" | "fb-reel" | "fb-story";
export type LinkedInContentType = "ln-text-post" | "ln-document" | "ln-article" | "ln-video";
export type TikTokContentType = "short-video" | "photo-carousel";
export type YouTubeContentType = "long-form" | "shorts" | "live-stream" | "community-post";
export type ContentType = InstagramContentType | TikTokContentType | YouTubeContentType | FacebookContentType | LinkedInContentType;

export interface PillarGoal {
  id: string;
  metric: string;
  target: number;
  unit: "%" | "followers" | "posts" | "views" | "leads" | string;
  period: "monthly" | "quarterly" | "yearly";
  current?: number;
}

export type ObjectiveCategory =
  | "growth"
  | "revenue"
  | "awareness"
  | "trust"
  | "community"
  | "engagement";

export interface BusinessObjective {
  id: string;
  category: ObjectiveCategory;
  statement: string;
  target: number;
  unit: string;
  timeframe: string;
  currentValue?: number;
  pillarIds?: string[];
  status: "on-track" | "at-risk" | "behind" | "achieved";
}

export interface BrandPositioning {
  targetCustomer: string;
  problemSolved: string;
  solution: string;
  differentiator: string;
  positioningStatement: string;
}

export interface ContentPillar {
  id: string;
  name: string;
  description: string;
  color: string;
  goals?: PillarGoal[];
  objectiveIds?: string[];
}

export type JourneyStage = "awareness" | "consideration" | "conversion" | "retention";

export interface SegmentJourneyStage {
  stage: JourneyStage;
  primaryGoal: string;
  contentTypes: string[];
  hookAngles: string[];
  successMetric: string;
}

export interface AudienceSegment {
  id: string;
  name: string;
  description: string;
  demographics?: string;
  interests?: string[];
  painPoints?: string[];
  peakTimes?: string[];
  journeyStages?: SegmentJourneyStage[];
}

export interface Attachment {
  name: string;
  type: string;
  size: string;
}

export interface CompetitorIntel {
  handle: string;
  platform: Platform;
  analyzedAt: string;
  positioning: {
    brandVoice: string;
    primaryMessage: string;
    messagingHierarchy: string[];
    targetAudience: string;
  };
  contentStrategy: {
    topFormat: string;
    postingFrequency: string;
    hookStyle: string;
    ctaPattern: string;
    engagementSignal: "Very High" | "High" | "Medium" | "Low";
  };
  gaps: {
    uncoveredAngles: string[];
    missedPainPoints: string[];
    counterStrategy: string;
  };
}

export type ContentCategory =
  | "educational"
  | "entertaining"
  | "community"
  | "promotional"
  | "trending";

export interface ContentMixTarget {
  category: ContentCategory;
  label: string;
  targetPercent: number;
  color: string;
  description: string;
}

export interface ContentItem {
  id: string;
  conceptId?: string; // Links variations to their parent concept
  stage: ContentStage;
  status: ContentStatus;
  title: string;
  description: string;
  pillarIds: string[];
  segmentIds: string[];
  objectiveId?: string;
  contentCategory?: ContentCategory;
  createdAt: string;
  updatedAt: string;
  
  // Core Identity Fields (required for Concept stage)
  hook?: string;
  objective?: ContentObjective;
  owner?: string; // User reference
  
  // Directional Fields (Strategic Context)
  platform?: Platform; // Optional at Concept, Required before In Production
  contentType?: ContentType;
  productionTargets?: { platform: Platform; contentType: ContentType }[];
  audienceSegment?: string; // Primary audience segment
  cta?: {
    type: CTATypeEnum;
    text: string;
  };
  
  // Creative Direction Fields
  keyMessage?: string; // Max 180 characters
  angle?: string; // Angle/Take
  formatNotes?: FormatNote[]; // Multi-select
  tags?: string[]; // Multi-chip
  
  // Risk & Compliance Fields
  claimsFlag?: boolean;
  sourceLinks?: string[]; // URL list (required if claimsFlag = true)
  riskLevel?: RiskLevel;
  
  // Planning Fields
  targetPublishWindow?: {
    start: string;
    end: string;
  };
  collaborators?: string[]; // Multi-user reference
  
  // Legacy/Post fields
  sourceUrl?: string; // Single source URL (legacy - use sourceLinks for multiple)
  attachments?: Attachment[];
  textOverlay?: string;
  script?: string;
  caption?: string;
  hashtags?: string[];
  scheduledDate?: string;
  scheduledTime?: string;
  thumbnailUrl?: string;
  // Review
  approvedBy?: string;
  approvedAt?: string;
  reviewNotes?: string;
  // Performance
  metrics?: ContentMetrics;
  // Production Blueprint
  production?: ProductionData;
}

export interface ContentMetrics {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  engagementRate: number;
  reach: number;
}

export interface CompetitorInsight {
  id: string;
  competitor: string;
  platform: Platform;
  contentType: string;
  topic: string;
  relevancyLevel: "Very High" | "High" | "Medium";
  frequency: string;
  insight: string;
  intel?: CompetitorIntel;
  intelOpen?: boolean;
  isRunningIntel?: boolean;
  deleteConfirm?: boolean;
}

export interface ResearchSource {
  id: string;
  title: string;
  url: string;
  type: "article" | "report" | "social" | "news" | "video";
  relevance: number;
  pillarIds: string[];
  summary: string;
  discoveredAt: string;
}

export interface AudienceInsight {
  segmentId: string;
  interests: string[];
  painPoints: string[];
  peakActivityTimes: { day: string; hour: string; engagement: string }[];
  preferredPlatforms: { platform: Platform; preference: number }[];
  contentPreferences: string[];
}

export const PLATFORM_CONTENT_TYPES: Record<Platform, { value: ContentType; label: string; icon: string }[]> = {
  instagram: [
    { value: "reel", label: "Reel", icon: "film" },
    { value: "carousel", label: "Carousel", icon: "images" },
    { value: "feed-post", label: "Feed Post", icon: "image" },
    { value: "story", label: "Stories", icon: "circle" },
    { value: "guide", label: "Guide", icon: "book" },
    { value: "live", label: "Live", icon: "radio" },
  ],
  tiktok: [
    { value: "short-video", label: "Short-form Video", icon: "video" },
    { value: "photo-carousel", label: "Photo Carousel", icon: "images" },
  ],
  youtube: [
    { value: "long-form", label: "Long-form Video", icon: "monitor" },
    { value: "shorts", label: "Shorts", icon: "zap" },
    { value: "live-stream", label: "Live Stream", icon: "radio" },
    { value: "community-post", label: "Community Post", icon: "message" },
  ],
  facebook: [
    { value: "fb-feed-post", label: "Feed Post", icon: "image" },
    { value: "fb-link-post", label: "Link Post", icon: "link" },
    { value: "fb-reel", label: "Reel", icon: "film" },
    { value: "fb-story", label: "Story", icon: "circle" },
    { value: "fb-live", label: "Live", icon: "radio" },
  ],
  linkedin: [
    { value: "ln-text-post", label: "Text Post", icon: "type" },
    { value: "ln-document", label: "Document / Carousel", icon: "file-text" },
    { value: "ln-article", label: "Article", icon: "book" },
    { value: "ln-video", label: "Video", icon: "video" },
  ],
  tbd: [
    { value: "reel", label: "Reel", icon: "film" },
    { value: "carousel", label: "Carousel", icon: "images" },
    { value: "feed-post", label: "Feed Post", icon: "image" },
    { value: "story", label: "Stories", icon: "circle" },
    { value: "guide", label: "Guide", icon: "book" },
    { value: "live", label: "Live", icon: "radio" },
    { value: "short-video", label: "Short-form Video", icon: "video" },
    { value: "photo-carousel", label: "Photo Carousel", icon: "images" },
    { value: "long-form", label: "Long-form Video", icon: "monitor" },
    { value: "shorts", label: "Shorts", icon: "zap" },
    { value: "live-stream", label: "Live Stream", icon: "radio" },
    { value: "community-post", label: "Community Post", icon: "message" },
    { value: "fb-link-post", label: "Link Post", icon: "link" },
    { value: "fb-feed-post", label: "Feed Post", icon: "image" },
    { value: "fb-live", label: "Live", icon: "radio" },
    { value: "fb-reel", label: "Reel", icon: "film" },
    { value: "fb-story", label: "Story", icon: "circle" },
    { value: "ln-text-post", label: "Text Post", icon: "type" },
    { value: "ln-document", label: "Document / Carousel", icon: "file-text" },
    { value: "ln-article", label: "Article", icon: "book" },
    { value: "ln-video", label: "Video", icon: "video" },
  ],
};

export const DEFAULT_PILLARS: ContentPillar[] = [
  { id: "p1", name: "Yoga & Movement", description: "Yoga flows, stretching routines, and mindful movement practices", color: "#d94e33" },
  { id: "p2", name: "Wellness & Mindfulness", description: "Stress management, meditation, sleep, and mental health", color: "#10b981" },
  { id: "p3", name: "Fitness & Strength", description: "Strength training, cardio, and fitness routines for women 40+", color: "#3b82f6" },
  { id: "p4", name: "Nutrition & Recipes", description: "Healthy eating, meal prep, and nutrition for hormonal health", color: "#f59e0b" },
  { id: "p5", name: "Aging & Confidence", description: "Body positivity, aging gracefully, and empowerment content", color: "#8b5cf6" },
];

export const DEFAULT_SEGMENTS: AudienceSegment[] = [
  { id: "s1", name: "Active 40s", description: "Women in their 40s maintaining fitness and managing perimenopause", interests: ["Strength training", "Hormone health", "Energy management"], painPoints: ["Metabolism changes", "Energy fluctuations", "Balancing career and health"], peakTimes: ["Mon 6am", "Wed 12pm", "Sat 8am"] },
  { id: "s2", name: "Thriving 50s", description: "Women in their 50s focused on strength, flexibility, and menopause wellness", interests: ["Bone health", "Joint mobility", "Menopause support"], painPoints: ["Joint pain", "Weight management", "Sleep disruption"], peakTimes: ["Tue 7am", "Thu 10am", "Sun 9am"] },
  { id: "s3", name: "Yoga Enthusiasts", description: "Women passionate about yoga practice and mindful movement", interests: ["Yoga flows", "Meditation", "Breathwork"], painPoints: ["Flexibility loss", "Stress management", "Finding time"], peakTimes: ["Mon 7am", "Wed 6pm", "Sat 9am"] },
  { id: "s4", name: "Fitness Beginners", description: "Women new to fitness or restarting their wellness journey", interests: ["Simple workouts", "Motivation", "Gentle routines"], painPoints: ["Intimidation", "Past injuries", "Lack of confidence"], peakTimes: ["Tue 9am", "Thu 11am", "Sat 10am"] },
  { id: "s5", name: "Holistic Health Seekers", description: "Women focused on whole-body wellness and natural living", interests: ["Clean eating", "Natural remedies", "Gut health"], painPoints: ["Information overload", "Diet confusion", "Sustainable habits"], peakTimes: ["Mon 10am", "Wed 2pm", "Fri 11am"] },
];

import { WELLNESS_CONTENT } from "./wellness-mock-data";
import { INSTAGRAM_EXAMPLES } from "./instagram-examples";
import { IDEA_STAGE_CONTENT } from "./idea-stage-content";

export const MOCK_CONTENT: ContentItem[] = [
  ...WELLNESS_CONTENT,
  ...INSTAGRAM_EXAMPLES,
  ...IDEA_STAGE_CONTENT,
];

export const MOCK_RESEARCH_SOURCES: ResearchSource[] = [
  { id: "rs1", title: "Yoga for Women Over 40: Joint Health & Flexibility", url: "https://example.com/yoga-joint-health", type: "report", relevance: 98, pillarIds: ["p1"], summary: "Study on how modified yoga poses and gentle flows help women 40+ maintain joint health and flexibility while reducing injury risk.", discoveredAt: "2026-02-20T08:00:00" },
  { id: "rs2", title: "Menopause & Fitness: Strength Training Guidelines", url: "https://example.com/menopause-strength", type: "report", relevance: 95, pillarIds: ["p3"], summary: "Evidence-based strength training protocols for women managing perimenopause and menopause, focusing on bone density and metabolic health.", discoveredAt: "2026-02-19T10:00:00" },
  { id: "rs3", title: "Anti-Inflammatory Nutrition for Hormonal Health", url: "https://example.com/anti-inflammatory-nutrition", type: "article", relevance: 93, pillarIds: ["p4"], summary: "Comprehensive guide to anti-inflammatory eating patterns that support hormone balance and reduce inflammation in women 40+.", discoveredAt: "2026-02-21T14:00:00" },
  { id: "rs4", title: "Meditation & Sleep Quality in Midlife Women", url: "https://example.com/meditation-sleep", type: "report", relevance: 91, pillarIds: ["p2"], summary: "Research showing how mindfulness meditation practices improve sleep quality and reduce stress for women experiencing perimenopause.", discoveredAt: "2026-02-22T09:00:00" },
  { id: "rs5", title: "Body Confidence Movement: Women 40+ on Social Media", url: "https://example.com/body-confidence-trends", type: "article", relevance: 88, pillarIds: ["p5"], summary: "Analysis of trending body positivity content for midlife women, showing authentic representation drives 3x higher engagement.", discoveredAt: "2026-02-18T11:00:00" },
  { id: "rs6", title: "Gut Health & Hormones: What Women Need to Know", url: "https://example.com/gut-hormones", type: "report", relevance: 89, pillarIds: ["p2", "p4"], summary: "Latest research on gut microbiome's role in hormone regulation, metabolism, and overall wellness for women in their 40s and 50s.", discoveredAt: "2026-02-17T15:00:00" },
];

export const MOCK_COMPETITOR_INSIGHTS: CompetitorInsight[] = [
  { id: "ci1", competitor: "Yoga with Adriene", platform: "youtube", contentType: "Long-form", topic: "30-day yoga journeys", relevancyLevel: "Very High", frequency: "Daily", insight: "Monthly yoga challenges with daily 20-30 min videos. Strong community engagement in comments. Gentle, accessible approach resonates with 40+ audience." },
  { id: "ci2", competitor: "Move with Nicole", platform: "instagram", contentType: "Reels", topic: "Low-impact fitness demos", relevancyLevel: "High", frequency: "4x/week", insight: "Short fitness demos focused on joint-friendly movements. Clear form cues and modifications for different fitness levels." },
  { id: "ci3", competitor: "The Midlife Feast", platform: "instagram", contentType: "Carousel", topic: "Nutrition & recipes", relevancyLevel: "High", frequency: "3x/week", insight: "Recipe carousels with ingredient benefits highlighted. Focus on anti-inflammatory foods and hormone-supporting nutrition." },
  { id: "ci4", competitor: "Dr. Mary Claire Haver", platform: "tiktok", contentType: "Short-form", topic: "Menopause education", relevancyLevel: "Very High", frequency: "5x/week", insight: "Myth-busting menopause content with medical expertise. Direct, science-backed tips in under 60 seconds drive strong saves and shares." },
  { id: "ci5", competitor: "Fit After 40", platform: "youtube", contentType: "Shorts", topic: "Quick strength workouts", relevancyLevel: "Medium", frequency: "6x/week", insight: "15-second exercise demos with clear benefits callout. Focus on functional strength for everyday activities." },
];

export const MOCK_AUDIENCE_INSIGHTS: AudienceInsight[] = [
  {
    segmentId: "s1",
    interests: ["Strength training", "Hormone health", "Energy management", "Metabolism support"],
    painPoints: ["Energy fluctuations throughout day", "Metabolism slowing down", "Balancing career demands with self-care", "Finding time for fitness"],
    peakActivityTimes: [
      { day: "Monday", hour: "6:00 AM", engagement: "Very High" },
      { day: "Wednesday", hour: "12:00 PM", engagement: "High" },
      { day: "Saturday", hour: "8:00 AM", engagement: "High" },
    ],
    preferredPlatforms: [{ platform: "instagram", preference: 88 }, { platform: "youtube", preference: 75 }, { platform: "tiktok", preference: 45 }],
    contentPreferences: ["Quick workout routines", "Hormone health tips", "Energy-boosting nutrition", "Motivational content"],
  },
  {
    segmentId: "s2",
    interests: ["Bone health", "Joint mobility", "Menopause support", "Gentle movement"],
    painPoints: ["Joint pain and stiffness", "Weight management challenges", "Sleep disruption", "Hot flashes affecting workouts"],
    peakActivityTimes: [
      { day: "Tuesday", hour: "7:00 AM", engagement: "Very High" },
      { day: "Thursday", hour: "10:00 AM", engagement: "High" },
      { day: "Sunday", hour: "9:00 AM", engagement: "Medium" },
    ],
    preferredPlatforms: [{ platform: "youtube", preference: 92 }, { platform: "instagram", preference: 70 }, { platform: "facebook", preference: 65 }],
    contentPreferences: ["Low-impact exercises", "Menopause education", "Joint-friendly yoga", "Strength training for bone health"],
  },
  {
    segmentId: "s3",
    interests: ["Yoga flows", "Meditation", "Breathwork", "Stress reduction"],
    painPoints: ["Flexibility loss", "Chronic stress", "Finding consistent practice time", "Staying motivated"],
    peakActivityTimes: [
      { day: "Monday", hour: "7:00 AM", engagement: "Very High" },
      { day: "Wednesday", hour: "6:00 PM", engagement: "High" },
      { day: "Saturday", hour: "9:00 AM", engagement: "Very High" },
    ],
    preferredPlatforms: [{ platform: "youtube", preference: 90 }, { platform: "instagram", preference: 85 }, { platform: "tiktok", preference: 40 }],
    contentPreferences: ["Guided yoga flows", "Meditation practices", "Breathwork tutorials", "Mindfulness tips"],
  },
  {
    segmentId: "s4",
    interests: ["Simple workouts", "Beginner-friendly content", "Motivation", "Gentle routines"],
    painPoints: ["Gym intimidation", "Past injuries", "Lack of confidence", "Not knowing where to start"],
    peakActivityTimes: [
      { day: "Tuesday", hour: "9:00 AM", engagement: "High" },
      { day: "Thursday", hour: "11:00 AM", engagement: "High" },
      { day: "Saturday", hour: "10:00 AM", engagement: "Very High" },
    ],
    preferredPlatforms: [{ platform: "instagram", preference: 80 }, { platform: "youtube", preference: 85 }, { platform: "tiktok", preference: 50 }],
    contentPreferences: ["Step-by-step tutorials", "Encouraging messaging", "Form demonstrations", "Beginner modifications"],
  },
  {
    segmentId: "s5",
    interests: ["Clean eating", "Natural remedies", "Gut health", "Holistic wellness"],
    painPoints: ["Nutrition information overload", "Diet confusion", "Sustainable habit formation", "Food sensitivities"],
    peakActivityTimes: [
      { day: "Monday", hour: "10:00 AM", engagement: "High" },
      { day: "Wednesday", hour: "2:00 PM", engagement: "Very High" },
      { day: "Friday", hour: "11:00 AM", engagement: "High" },
    ],
    preferredPlatforms: [{ platform: "instagram", preference: 90 }, { platform: "youtube", preference: 70 }, { platform: "facebook", preference: 60 }],
    contentPreferences: ["Nutrition education", "Healthy recipes", "Gut health tips", "Natural wellness practices"],
  },
];

export const STAGE_CONFIG = {
  idea: { label: "Idea", color: "bg-blue-100 text-blue-700 border-blue-200", dotColor: "bg-blue-500" },
  concept: { label: "Concept", color: "bg-amber-100 text-amber-700 border-amber-200", dotColor: "bg-amber-500" },
  post: { label: "Post", color: "bg-emerald-100 text-emerald-700 border-emerald-200", dotColor: "bg-emerald-500" },
};

export const STATUS_CONFIG = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-600 border-gray-200", dotColor: "bg-gray-400" },
  "in-progress": { label: "In Progress", color: "bg-blue-100 text-blue-700 border-blue-200", dotColor: "bg-blue-500" },
  review: { label: "Review", color: "bg-purple-100 text-purple-700 border-purple-200", dotColor: "bg-purple-500" },
  scheduled: { label: "Scheduled", color: "bg-pink-100 text-pink-700 border-pink-200", dotColor: "bg-pink-500" },
  published: { label: "Published", color: "bg-green-100 text-green-700 border-green-200", dotColor: "bg-green-500" },
};

export const PLATFORM_CONFIG: Record<Platform, { label: string; color: string; bgColor: string }> = {
  instagram: { label: "Instagram", color: "text-pink-600", bgColor: "bg-pink-50" },
  tiktok: { label: "TikTok", color: "text-gray-900", bgColor: "bg-gray-100" },
  youtube: { label: "YouTube", color: "text-red-600", bgColor: "bg-red-50" },
  facebook: { label: "Facebook", color: "text-blue-600", bgColor: "bg-blue-50" },
  linkedin: { label: "LinkedIn", color: "text-blue-700", bgColor: "bg-blue-50" },
  tbd: { label: "TBD", color: "text-gray-500", bgColor: "bg-gray-50" },
};

export const WORKFLOW_STEPS = [
  { id: "overview" as const, label: "Overview", shortLabel: "Overview", step: 1 },
  { id: "strategy" as const, label: "Strategy & Research", shortLabel: "Strategy", step: 2 },
  { id: "ideation" as const, label: "Ideation & Planning", shortLabel: "Ideation", step: 3 },
  { id: "production" as const, label: "Content Production", shortLabel: "Production", step: 4 },
  { id: "review" as const, label: "Review & Scheduling", shortLabel: "Review", step: 5 },
  { id: "performance" as const, label: "Performance Tracking", shortLabel: "Performance", step: 6 },
];

// ─── Production Blueprint Types ───

export type ProductionStep = "select" | "brief" | "builder" | "packaging" | "qa" | "handoff";

export type Objective = "awareness" | "engagement" | "traffic" | "leads" | "sales" | "community" | "recruiting" | "lead-gen" | "trust" | "education" | "conversion";
export type CTAType = "follow" | "link" | "comment" | "share" | "subscribe" | "swipe" | "dm" | "none";
export type TonePreset = "professional" | "casual" | "bold" | "empathetic" | "educational" | "playful";
export type HookType = "pattern-break" | "problem-first" | "outcome-first" | "story-first" | "question";
export type VideoStyle = "talking-head" | "interview" | "tutorial" | "b-roll-montage" | "text-only" | "duet-style" | "screen-recording";
export type StoryArc = "hook-promise-sections-recap-cta" | "problem-solution" | "listicle" | "narrative" | "before-after";
export type CarouselGoal = "teach" | "convert" | "story" | "proof";
export type PostIntent = "announcement" | "quote" | "stat" | "product" | "meme" | "event";
export type InteractionType = "poll" | "question" | "link" | "quiz" | "none";
export type HashtagStyle = "none" | "light" | "heavy";

export interface BriefStrategy {
  objective: Objective;
  audienceSegmentIds: string[];
  pillarIds: string[];
  keyMessage: string;
  ctaType: CTAType;
  ctaText?: string;
  tonePreset: TonePreset;
  doChecklist?: string[];
  dontChecklist?: string[];
}

export interface BriefPlatformRules {
  // Video types
  targetLengthMin?: number;
  targetLengthMax?: number;
  videoStyle?: VideoStyle;
  hookType?: HookType;
  seoKeyword?: string;
  viewerPromise?: string;
  // Shorts/Reels/TikTok
  durationTarget?: 15 | 30 | 45 | 60 | 90;
  loopEnding?: boolean;
  onScreenTextLines?: string[];
  // Carousel
  carouselGoal?: CarouselGoal;
  slideCount?: number;
  // Post
  postIntent?: PostIntent;
  copyOnImage?: string;
  captionMaxLength?: number;
  hashtagStyle?: HashtagStyle;
  // Stories
  frameCount?: number;
  interactionType?: InteractionType;
  // TikTok specific
  creatorVoice?: "casual" | "brand-polished";
  commentBait?: string;
  isSeriesPart?: boolean;
}

export interface BriefCreativePlan {
  hook?: string;
  storyArc?: StoryArc;
  sections?: BriefSection[];
  bRollList?: string[];
  onScreenMoments?: string[];
  musicNotes?: string;
  // Carousel
  slides?: SlideOutline[];
  // Stories
  frames?: FrameOutline[];
}

export interface BriefSection {
  id: string;
  title: string;
  keyPoints: string[];
  sourceUrl?: string;
}

export interface SlideOutline {
  id: string;
  slideNumber: number;
  headline: string;
  body: string;
  visualGuidance: string;
  assetType?: "upload" | "ai-generate";
  assetUrl?: string;
  isCTA?: boolean;
  slideRole?: "hook" | "value" | "proof" | "expansion" | "cta" | "transition";
}

export interface CarouselBlueprint {
  narrativePattern?: string;
  hookType?: string;
  hookScrollStop?: boolean;
  hookValuePromise?: boolean;
  consistentLayout?: boolean;
  fontHierarchyConfirmed?: boolean;
  logoPlacementConsistent?: boolean;
  ctaVisuallyDistinct?: boolean;
  saveIntent?: boolean;
  shareIntent?: boolean;
  commentPrompt?: boolean;
  swipeTease?: boolean;
  highContrast?: boolean;
  textReadable?: boolean;
  safeMargin?: boolean;
  altTextPlanned?: boolean;
  primaryCtaType?: string;
  ctaPlacementSlide?: number;
  ctaExplicit?: boolean;
}

export interface FrameOutline {
  id: string;
  frameNumber: number;
  script: string;
  onScreenText: string;
  stickerRecommendation?: string;
}

export interface BriefCompliance {
  containsClaims: boolean;
  claims?: { claim: string; citation: string; cited: boolean }[];
  disclosureNeeded: boolean;
  disclosureType?: string;
}

export interface ContentBrief {
  strategy: BriefStrategy;
  platformRules: BriefPlatformRules;
  creativePlan: BriefCreativePlan;
  compliance: BriefCompliance;
  approved: boolean;
  approvedAt?: string;
  approvedBy?: string;
  approvalNote?: string;
  unlockedAt?: string;
  unlockedBy?: string;
  // Brief v2 fields — canonical structure per brief-requirements.md
  canonicalType?: CanonicalContentType;
  publishingMode?: "ORGANIC" | "PAID_BOOSTED";
  hasTalent?: boolean;
  hasMusic?: boolean;
  needsAccessibility?: boolean;
  owner?: string;
  dueDate?: string;
  primaryCta?: string;
  destinationUrl?: string;
  approvers?: string[];
  audienceNotes?: string;
  constraintsNotes?: string;
  referenceLinks?: string[];
  hookAngle?: string;
  campaignName?: string;
  paidPartnership?: boolean;
}

export interface StillBrief {
  primaryText: string;
  visualConcept: string;
  brandConstraints?: string;
  dimensions: string;
  contrastWarning?: boolean;
}

// ─── Blueprint Data (Platform-Agnostic) ───

export type UnitRole = "hook" | "value" | "proof" | "expansion" | "cta" | "transition";

export interface BlueprintUnit {
  id: string;
  order: number;
  title: string;
  role: UnitRole;
  notes?: string;
}

export interface BlueprintData {
  // Structure (legacy)
  structurePattern: string;
  customStructureDescription?: string;
  units: BlueprintUnit[];

  // Engagement & Conversion (legacy)
  engagementDrivers: string[];
  primaryCTAType?: string;
  ctaPlacementUnitId?: string;

  // Format & Accessibility (legacy)
  formatCoherenceConfirmed: boolean;
  logicalProgressionConfirmed: boolean;
  accessibilityPlanConfirmed: boolean;

  // ─── v2 fields (blueprint-requirements.md) ───

  // Section 2: Format Plan
  formatProfile?: string;
  aspectRatio?: string;
  runtimeSeconds?: number;
  unitCountTarget?: number;

  // Section 3: Structure Plan
  // 3A: Video
  beats?: { id: string; label: string; checked: boolean }[];
  ctaPlacement?: "early" | "middle" | "end" | "repeated";
  // 3B: Carousel / PDF
  slidePattern?: string;
  // 3C: Stories
  storyArc?: string;
  interactiveElements?: string[];
  // 3D: Live
  runOfShow?: { id: string; label: string; notes: string; checked: boolean }[];
  liveRoles?: { id: string; role: string; assignee: string }[];
  liveEngagementPlan?: string;

  // Section 4: Audio / Music
  audioPlan?: string;
  musicSource?: string;

  // Section 5: Accessibility
  captionsStrategy?: string;
  altTextStrategy?: string;
  motionSafety?: string[];

  // Section 6: Compliance & Risk
  claimsRisk?: string;
  disclaimerPattern?: string;

  // Section 8: Advanced
  productionNotes?: string;
  shotList?: { id: string; label: string; checked: boolean }[];
  chaptersPlan?: string;
  brandStyleConstraints?: string;
}

export interface ProductionOutput {
  scriptVersions?: { id: string; content: string; version: number; approved: boolean }[];
  hookVariants?: string[];
  captionVariants?: string[];
  hashtagSets?: { name: string; tags: string[] }[];
  beatSheet?: { timeRange: string; content: string }[];
  slideOutlines?: SlideOutline[];
  metadata?: YouTubeMetadata;
  stillBrief?: StillBrief;
  carouselBlueprint?: CarouselBlueprint;
  blueprintData?: BlueprintData;
  assetsData?: AssetsData;
  packagingData?: PackagingData;
  qaData?: QAData;
  altText?: string;
  editNotes?: string;
  repurposePlan?: string[];
  amplification?: AmplificationData;

  // ─── Spec-aligned Draft fields (draft-requirements.md) ───
  hook?: string;              // §2A – selected/active hook
  hookBank?: string[];        // §2A – AI-generated hook options
  postCopy?: string;          // §2B – caption / post text / description
  script?: string;            // §2C – script / run-of-show
  onScreenText?: string;      // §2D – OST plan
  storyFrames?: { id: string; frameNumber: number; text: string; ostText: string }[]; // §2E
  // slide_outline → slideOutlines (existing field, reused)
  ctaLine?: string;           // §3  – CTA line
  links?: string[];           // §3  – destination URLs
  hashtags?: string[];        // §4  – active hashtags
  mentions?: string[];        // §4  – @mentions / collaborators
  location?: string;          // §4  – location tag
  disclosures?: string;       // §5  – disclosure / #ad copy
  claimsList?: string[];      // §5  – individual claims for QA
  safetyDisclaimer?: string;  // §5  – safety / medical disclaimer
  contentNotes?: string;      // §6  – creative notes to production
  pinnedComment?: string;     // extra – pinned comment draft
  activityData?: ActivityData;
}

export interface YouTubeMetadata {
  titleOptions: string[];
  description: string;
  chapters?: { time: string; title: string }[];
  tags: string[];
}

export interface AssetChecklistItem {
  id: string;
  label: string;
  required: boolean;
  completed: boolean;
  assignee?: string;
  notes?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  aiGenerated?: boolean;
}

export interface ProductionTask {
  id: string;
  label: string;
  assignee: string;
  completed: boolean;
  dueDate?: string;
}

export interface ProductionData {
  productionStep: ProductionStep;
  brief?: ContentBrief;
  sources: ProductionSource[];
  outputs: ProductionOutput;
  assets: AssetChecklistItem[];
  tasks: ProductionTask[];
  internalApproval?: { approved: boolean; comments: string[]; reviewer?: string };
  versions: { label: string; savedAt: string }[];
  amplification?: AmplificationData;
}

export interface ProductionSource {
  id: string;
  url: string;
  title: string;
  keyTakeaways: string;
  type: "article" | "report" | "social" | "news" | "video" | "docs";
}

export type CanonicalContentType =
  | "VIDEO_SHORT_VERTICAL"
  | "VIDEO_LONG_HORIZONTAL"
  | "VIDEO_SHORT_HORIZONTAL"
  | "IMAGE_SINGLE"
  | "IMAGE_CAROUSEL"
  | "TEXT_POST"
  | "LINK_POST"
  | "DOCUMENT_CAROUSEL_PDF"
  | "STORY_FRAME_SET"
  | "LIVE_BROADCAST";

// ─── End Production Blueprint Types ───

// ─── Assets Data ───

export interface AssetFileEntry {
  id: string;
  name: string;
  url?: string;
  size?: string;
  addedAt: string;
}

export interface AssetsData {
  masterUploads: AssetFileEntry[];
  coverUpload?: AssetFileEntry;
  creativeVariants: AssetFileEntry[];
  captionsFile?: AssetFileEntry;
  altText?: string;
  altTextItems?: { id: string; slideIndex: number; text: string }[];
  talentReleaseUrl?: string;
  musicLicenseUrl?: string;
  thirdPartyRightsUrl?: string;
  sourceFiles: AssetFileEntry[];
  exportNotes?: string;
  checklistOverrides: Record<string, boolean>;
}

// ─── End Assets Data ───

// ─── Packaging Data ───

export type PublishAction = "publish-now" | "schedule" | "save-draft" | "export-packet";
export type Visibility = "public" | "unlisted" | "private";

export interface PackagingData {
  // Section 2 — Publish Settings
  publishAction: PublishAction;
  visibility: Visibility;
  scheduleAt?: string;

  // Section 3 — Platform Metadata
  title?: string;
  packagedCopy?: string;
  description?: string;
  keywords?: string[];

  // Section 4 — Media Selections
  primaryMediaAsset?: string;
  coverAsset?: string;
  carouselOrder?: string[];

  // Section 5 — Links & Tracking
  destinationUrl?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;

  // Section 6 — Platform Controls (YouTube)
  category?: string;
  madeForKids?: boolean;
  playlist?: string;
  // Instagram
  collaboratorTags?: string[];
  igLocation?: string;
  // TikTok
  allowComments?: boolean;
  allowDuetStitch?: boolean;
  // Facebook
  fbPage?: string;
  crosspostToIg?: boolean;
  // LinkedIn
  liPublisherIdentity?: string;
  pinnedComment?: string;
}

// ─── End Packaging Data ───

// ─── QA Data ───

export type ApprovalStatus = "pending" | "approved" | "changes-requested";

export interface QACheckItem {
  id: string;
  label: string;
  group: "brand" | "visual" | "accessibility" | "compliance" | "links" | "live";
  groupLabel: string;
  required: boolean;
  checked: boolean;
}

export interface ApprovalEntry {
  role: "brand-reviewer" | "legal-compliance" | "publisher";
  label: string;
  required: boolean;
  status: ApprovalStatus;
  userName?: string;
  timestamp?: string;
  note?: string;
}

export interface AuditEntry {
  id: string;
  action: string;
  userName?: string;
  timestamp: string;
}

export interface QAData {
  humanChecklist: QACheckItem[];
  approvals: ApprovalEntry[];
  qaNotes: string;
  fixAssignee: string;
  auditTrail: AuditEntry[];
  approved?: boolean;
}

// ─── End QA Data ───

// ─── Amplification Data ───

export interface AmplificationData {
  boostEnabled?: "yes" | "no" | "later";
  boostPlatform?: Platform;
  boostBudget?: string;
  boostDuration?: string;
  boostAudience?: string;
  crossPostPlans?: { platform: Platform; enabled: boolean; adaptationNote: string }[];
  repurposePlan?: string;
  teamShare?: boolean;
  teamCaption?: string;
}

// ─── End Amplification Data ───

// ─── Activity Data ───

export type ActivityEventType =
  | "status"
  | "assignment"
  | "draft-edit"
  | "blueprint"
  | "asset"
  | "packaging"
  | "ai-validation"
  | "qa"
  | "approval"
  | "export"
  | "system";

export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  actor: string;
  message: string;
  timestamp: string;
  important: boolean;
  detail?: string;
  tab?: string;
}

export type DecisionScope = "brief" | "draft" | "blueprint" | "assets" | "packaging" | "qa";

export interface DecisionLogEntry {
  id: string;
  title: string;
  note: string;
  scope: DecisionScope;
  actor: string;
  timestamp: string;
}

export interface ActivityData {
  events: ActivityEvent[];
  decisionLog: DecisionLogEntry[];
}

// ─── End Activity Data ───

// ─── Repurposer Types ───

export interface RepurposeOutput {
  sourceText: string;
  pillarId: string;
  segmentId: string;
  generatedAt: string;
  reelHooks: string[];
  carouselSlides: { headline: string; role: string }[];
  instagramCaption: string;
  tiktokHook: string;
  youtubeShort: string;
  linkedinPost: string;
  facebookPost: string;
}

// ─── End Repurposer Types ───

// ─── Series Builder Types ───

export interface SeriesPost {
  postNumber: number;
  suggestedDay: string;
  contentType: ContentType;
  seriesRole: "Hook" | "Value" | "Proof" | "Pivot" | "Conversion";
  hook: string;
  captionSummary: string;
  cta: string;
  bridgeNote?: string;
}

export interface ContentSeries {
  title: string;
  narrativeArc: string;
  platform: Platform;
  goal: string;
  pillarId: string;
  segmentId: string;
  posts: SeriesPost[];
  generatedAt: string;
}

// ─── End Series Builder Types ───

// ─── A/B Analyzer Types ───

export interface ABAnalysisResult {
  winner: "A" | "B";
  confidence: "High" | "Medium" | "Low";
  verdict: string;
  variantA: {
    strengths: string[];
    weaknesses: string[];
    scores: { hook: number; clarity: number; emotion: number; cta: number };
  };
  variantB: {
    strengths: string[];
    weaknesses: string[];
    scores: { hook: number; clarity: number; emotion: number; cta: number };
  };
  improvedVersion: string;
  improvementRationale: string;
}

// ─── End A/B Analyzer Types ───

// ─── SEO Strategy Types ───

export interface HashtagSet {
  tier: "reach" | "niche" | "community";
  tags: string[];
}

export interface TrendingAngle {
  angle: string;
  hookExample: string;
  viralityLevel: "High" | "Medium" | "Emerging";
  searchVolume: string;
}

export interface SEOStrategy {
  platform: Platform;
  pillarId: string;
  goal: string;
  generatedAt: string;
  hashtagSets: HashtagSet[];
  bioKeywords: string[];
  searchIntents: string[];
  exampleBio: string;
  captionChecklist: { label: string; tip: string }[];
  trendingAngles: TrendingAngle[];
}

// ─── End SEO Strategy Types ───

// ─── Brand Voice & Tone Types ───

export interface VoiceAttribute {
  id: string;
  label: string;
  description: string;
  doExample: string;
  dontExample: string;
}

export interface ToneContext {
  id: string;
  context: string;
  tone: string;
  example: string;
}

export interface BrandVoice {
  missionStatement: string;
  voiceAttributes: VoiceAttribute[];
  toneByContext: ToneContext[];
  platformToneAdjustments: {
    platform: Platform;
    adjustment: string;
  }[];
  vocabulary: {
    preferred: string[];
    avoid: string[];
  };
  generatedAt?: string;
}

// ─── End Brand Voice & Tone Types ───

// ─── Channel Strategy Types ───

export interface ChannelStrategyEntry {
  platform: Platform;
  active: boolean;
  role: string;
  primaryContentTypes: ContentType[];
  toneAdjustment: string;
  postingCadence: string;
  primaryAudience: string;
  primaryGoal: string;
  notes: string;
  generatedAt?: string;
}

// ─── End Channel Strategy Types ───

// ─── Investment Allocator Types ───

export interface PillarAllocation {
  pillarId: string;
  postsPerWeek: number;
  percentage: number;
  rationale: string;
}

export interface PlatformAllocation {
  platform: Platform;
  postsPerWeek: number;
  rationale: string;
}

export interface InvestmentPlan {
  totalPostsPerWeek: number;
  pillarAllocations: PillarAllocation[];
  platformAllocations: PlatformAllocation[];
  quickWins: string[];
  generatedAt: string;
  selectedSegmentIds?: string[];
}

// ─── End Investment Allocator Types ───