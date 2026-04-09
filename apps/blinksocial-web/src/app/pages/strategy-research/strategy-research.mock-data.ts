import type {
  ContentPillar,
  AudienceSegment,
  ResearchSource,
  CompetitorInsight,
  CompetitorIntel,
  RepurposeOutput,
  SeriesOverview,
  AbAnalysisResult,
  SeoData,
  AudienceInsight,
  BusinessObjective,
} from './strategy-research.types';

export const DEFAULT_OBJECTIVES: BusinessObjective[] = [
  {
    id: 'obj-1',
    category: 'growth',
    statement: 'Grow combined social following to 25,000',
    target: 25000,
    unit: 'followers',
    timeframe: 'Q4 2026',
    status: 'on-track',
  },
  {
    id: 'obj-2',
    category: 'engagement',
    statement: 'Achieve 5% average engagement rate across platforms',
    target: 5,
    unit: '%',
    timeframe: 'Q3 2026',
    currentValue: 3.2,
    status: 'at-risk',
  },
  {
    id: 'obj-3',
    category: 'community',
    statement: 'Build an active community of 2,000 saving & sharing members',
    target: 2000,
    unit: 'members',
    timeframe: 'Q2 2026',
    currentValue: 1450,
    status: 'on-track',
  },
];

export const DEFAULT_PILLARS: ContentPillar[] = [
  { id: 'p1', name: 'Yoga & Movement', description: 'Yoga flows, stretching routines, and mindful movement practices', color: 'var(--blink-brand-primary)' },
  { id: 'p2', name: 'Wellness & Mindfulness', description: 'Stress management, meditation, sleep, and mental health', color: 'var(--blink-accent-green)' },
  { id: 'p3', name: 'Fitness & Strength', description: 'Strength training, cardio, and fitness routines for women 40+', color: 'var(--blink-accent-blue)' },
  { id: 'p4', name: 'Nutrition & Recipes', description: 'Healthy eating, meal prep, and nutrition for hormonal health', color: 'var(--blink-accent-amber)' },
  { id: 'p5', name: 'Aging & Confidence', description: 'Body positivity, aging gracefully, and empowerment content', color: 'var(--blink-accent-purple)' },
];

export const DEFAULT_SEGMENTS: AudienceSegment[] = [
  { id: 's1', name: 'Active 40s', description: 'Women in their 40s maintaining fitness and managing perimenopause' },
  { id: 's2', name: 'Thriving 50s', description: 'Women in their 50s focused on strength, flexibility, and menopause wellness' },
  { id: 's3', name: 'Yoga Enthusiasts', description: 'Women passionate about yoga practice and mindful movement' },
  { id: 's4', name: 'Fitness Beginners', description: 'Women new to fitness or restarting their wellness journey' },
  { id: 's5', name: 'Holistic Health Seekers', description: 'Women focused on whole-body wellness and natural living' },
];

export const MOCK_RESEARCH_SOURCES: ResearchSource[] = [
  { id: 'rs1', title: 'Yoga for Women Over 40: Joint Health & Flexibility', url: 'https://example.com/yoga-joint-health', type: 'report', relevance: 98, pillarIds: ['p1'], summary: 'Study on how modified yoga poses and gentle flows help women 40+ maintain joint health and flexibility while reducing injury risk.', discoveredAt: '2026-02-20T08:00:00' },
  { id: 'rs2', title: 'Menopause & Fitness: Strength Training Guidelines', url: 'https://example.com/menopause-strength', type: 'report', relevance: 95, pillarIds: ['p3'], summary: 'Evidence-based strength training protocols for women managing perimenopause and menopause, focusing on bone density and metabolic health.', discoveredAt: '2026-02-19T10:00:00' },
  { id: 'rs3', title: 'Anti-Inflammatory Nutrition for Hormonal Health', url: 'https://example.com/anti-inflammatory-nutrition', type: 'article', relevance: 93, pillarIds: ['p4'], summary: 'Comprehensive guide to anti-inflammatory eating patterns that support hormone balance and reduce inflammation in women 40+.', discoveredAt: '2026-02-21T14:00:00' },
  { id: 'rs4', title: 'Meditation & Sleep Quality in Midlife Women', url: 'https://example.com/meditation-sleep', type: 'report', relevance: 91, pillarIds: ['p2'], summary: 'Research showing how mindfulness meditation practices improve sleep quality and reduce stress for women experiencing perimenopause.', discoveredAt: '2026-02-22T09:00:00' },
  { id: 'rs5', title: 'Body Confidence Movement: Women 40+ on Social Media', url: 'https://example.com/body-confidence-trends', type: 'article', relevance: 88, pillarIds: ['p5'], summary: 'Analysis of trending body positivity content for midlife women, showing authentic representation drives 3x higher engagement.', discoveredAt: '2026-02-18T11:00:00' },
  { id: 'rs6', title: 'Gut Health & Hormones: What Women Need to Know', url: 'https://example.com/gut-hormones', type: 'report', relevance: 89, pillarIds: ['p2', 'p4'], summary: 'Latest research on gut microbiome role in hormone regulation, metabolism, and overall wellness for women in their 40s and 50s.', discoveredAt: '2026-02-17T15:00:00' },
];

export const MOCK_COMPETITOR_INTEL_FALLBACK: CompetitorIntel = {
  positioning: {
    brandVoice: 'Authoritative & Encouraging',
    primaryMessage: 'Sustainable wellness routines that fit a busy life.',
    targeting: 'Women 40-60 seeking trusted, science-backed guidance.',
  },
  contentStrategy: {
    topFormat: 'Short-form video',
    frequency: '4-5x per week',
    hookStyle: 'Question + payoff',
    ctaPattern: 'Save for later',
    engagement: 'High',
  },
  gaps: {
    uncoveredAngles: [
      'Beginner-safe progression frameworks',
      'Recovery rituals between sessions',
    ],
    missedPainPoints: [
      'Time scarcity for working professionals',
      'Confidence in form without a coach',
    ],
    counterStrategy: 'Lead with credentials and outcome stories tied to weekly micro-routines.',
  },
  recommendedActions: [
    'Publish a 5-day micro-routine starter guide',
    'Create a "before vs after one week" carousel',
  ],
  lastUpdated: '2026-04-01T12:00:00.000Z',
};

export const MOCK_COMPETITOR_INSIGHTS: CompetitorInsight[] = [
  {
    id: 'ci1', competitor: 'Yoga with Adriene', platform: 'youtube', contentType: 'Long-form', topic: '30-day yoga journeys', relevancyLevel: 'Very High', frequency: 'Daily',
    insight: 'Monthly yoga challenges with daily 20-30 min videos. Strong community engagement in comments.',
    intel: {
      positioning: { brandVoice: 'Warm & Inclusive', primaryMessage: 'Yoga is for every body, every day.', targeting: 'Beginners through intermediate yogis seeking consistency.' },
      contentStrategy: { topFormat: 'Long-form video', frequency: 'Daily', hookStyle: 'Themed monthly journey', ctaPattern: 'Join the next challenge', engagement: 'Very High' },
      gaps: {
        uncoveredAngles: ['Strength-forward yoga for perimenopause', 'Recovery-day mobility flows'],
        missedPainPoints: ['Joint discomfort during transitions', 'Plateaus after first month'],
        counterStrategy: 'Pair daily flows with explicit progression milestones tailored to midlife bodies.',
      },
      recommendedActions: ['Launch a 14-day midlife strength yoga series', 'Publish a recovery-day mobility routine'],
      lastUpdated: '2026-04-02T09:00:00.000Z',
    },
  },
  {
    id: 'ci2', competitor: 'Move with Nicole', platform: 'instagram', contentType: 'Reels', topic: 'Low-impact fitness demos', relevancyLevel: 'High', frequency: '4x/week',
    insight: 'Short fitness demos focused on joint-friendly movements. Clear form cues and modifications.',
    intel: {
      positioning: { brandVoice: 'Approachable & Expert', primaryMessage: 'Smart movement that protects your joints.', targeting: 'Women 35-55 returning to fitness after a break.' },
      contentStrategy: { topFormat: 'Reels', frequency: '4x/week', hookStyle: 'Common-mistake reveal', ctaPattern: 'Save and try this week', engagement: 'High' },
      gaps: {
        uncoveredAngles: ['Pelvic-floor-safe core work', 'Standing strength circuits'],
        missedPainPoints: ['Fear of injury after 40', 'Knowing when to progress load'],
        counterStrategy: 'Show weekly progression paths with concrete benchmarks.',
      },
      recommendedActions: ['Publish a 4-week progression chart', 'Demo pelvic-floor-safe core finishers'],
      lastUpdated: '2026-04-03T14:30:00.000Z',
    },
  },
  {
    id: 'ci3', competitor: 'The Midlife Feast', platform: 'instagram', contentType: 'Carousel', topic: 'Nutrition & recipes', relevancyLevel: 'High', frequency: '3x/week',
    insight: 'Recipe carousels with ingredient benefits highlighted. Anti-inflammatory foods focus.',
    intel: {
      positioning: { brandVoice: 'Educational & Calm', primaryMessage: 'Eat to support your hormones, not fight them.', targeting: 'Midlife women navigating perimenopause nutrition.' },
      contentStrategy: { topFormat: 'Carousel', frequency: '3x/week', hookStyle: 'Ingredient spotlight', ctaPattern: 'Swipe to save the recipe', engagement: 'High' },
      gaps: {
        uncoveredAngles: ['Quick weeknight meal frameworks', 'Eating-out playbooks'],
        missedPainPoints: ['Decision fatigue at dinner', 'Dining out without derailing goals'],
        counterStrategy: 'Pair recipes with dine-out swaps and 15-minute weeknight templates.',
      },
      recommendedActions: ['Publish a 5-meal weeknight template', 'Create a restaurant ordering cheat sheet'],
      lastUpdated: '2026-04-04T18:15:00.000Z',
    },
  },
  {
    id: 'ci4', competitor: 'Dr. Mary Claire Haver', platform: 'tiktok', contentType: 'Short-form', topic: 'Menopause education', relevancyLevel: 'Very High', frequency: '5x/week',
    insight: 'Myth-busting menopause content with medical expertise. Direct, science-backed tips.',
    intel: {
      positioning: { brandVoice: 'Direct & Authoritative', primaryMessage: 'Science-backed answers for menopause confusion.', targeting: 'Women 40+ frustrated by conflicting menopause advice.' },
      contentStrategy: { topFormat: 'Short-form video', frequency: '5x/week', hookStyle: 'Myth → fact reveal', ctaPattern: 'Follow for daily tips', engagement: 'Very High' },
      gaps: {
        uncoveredAngles: ['Workout pairings for HRT users', 'Stress-management protocols'],
        missedPainPoints: ['Sleep disruption', 'Workout recovery slowing down'],
        counterStrategy: 'Pair education with actionable training and recovery routines.',
      },
      recommendedActions: ['Publish a sleep-hygiene starter routine', 'Create an HRT-friendly training framework'],
      lastUpdated: '2026-04-05T08:45:00.000Z',
    },
  },
  {
    id: 'ci5', competitor: 'Fit After 40', platform: 'youtube', contentType: 'Shorts', topic: 'Quick strength workouts', relevancyLevel: 'Medium', frequency: '6x/week',
    insight: '15-second exercise demos with clear benefits callout. Functional strength focus.',
  },
];

export const MOCK_AUDIENCE_INSIGHTS: AudienceInsight[] = [
  {
    segmentId: 's1',
    interests: ['Strength training', 'Hormone health', 'Energy management', 'Metabolism support'],
    painPoints: ['Energy fluctuations throughout day', 'Metabolism slowing down', 'Balancing career demands with self-care', 'Finding time for fitness'],
    peakActivityTimes: [
      { day: 'Monday', hour: '6:00 AM', engagement: 'Very High' },
      { day: 'Wednesday', hour: '12:00 PM', engagement: 'High' },
      { day: 'Saturday', hour: '8:00 AM', engagement: 'High' },
    ],
    preferredPlatforms: [{ platform: 'instagram', preference: 88 }, { platform: 'youtube', preference: 75 }, { platform: 'tiktok', preference: 45 }],
    contentPreferences: ['Quick workout routines', 'Hormone health tips', 'Energy-boosting nutrition', 'Motivational content'],
  },
  {
    segmentId: 's2',
    interests: ['Bone health', 'Joint mobility', 'Menopause support', 'Gentle movement'],
    painPoints: ['Joint pain and stiffness', 'Weight management challenges', 'Sleep disruption', 'Hot flashes affecting workouts'],
    peakActivityTimes: [
      { day: 'Tuesday', hour: '7:00 AM', engagement: 'Very High' },
      { day: 'Thursday', hour: '10:00 AM', engagement: 'High' },
      { day: 'Sunday', hour: '9:00 AM', engagement: 'Medium' },
    ],
    preferredPlatforms: [{ platform: 'youtube', preference: 92 }, { platform: 'instagram', preference: 70 }, { platform: 'facebook', preference: 65 }],
    contentPreferences: ['Low-impact exercises', 'Menopause education', 'Joint-friendly yoga', 'Strength training for bone health'],
  },
];

export const MOCK_REPURPOSE_OUTPUT: Omit<RepurposeOutput, 'sourceText' | 'pillarId' | 'segmentId' | 'generatedAt'> = {
  reelHooks: [
    "Nobody tells women over 40 this about their metabolism — and it's costing you results.",
    "Stop blaming your hormones. Here's what's actually happening at 40.",
    'I tried 3 different morning routines. This one changed everything for perimenopause.',
  ],
  carouselSlides: [
    { role: 'hook',  headline: "Your metabolism isn't broken — you just need a new strategy" },
    { role: 'value', headline: "What changes at 40 (it's not what you think)" },
    { role: 'value', headline: 'The 3 hormones that control your energy' },
    { role: 'value', headline: 'Why cardio alone stops working' },
    { role: 'proof', headline: 'The strength training protocol that actually helps' },
    { role: 'cta',   headline: 'Save this for your next workout. Follow for more.' },
  ],
  instagramCaption:
    "Your 40s aren't working against you — your strategy might be.\n\nHere's what most women don't realize about perimenopause and fitness:\n\nThe rules genuinely change. Not because you're getting old, but because your hormones are shifting — and your training needs to shift with them.\n\nSwipe to see the 3 biggest changes and exactly what to do about each one. →\n\n#WomenOver40 #PerimenopauseFitness #HiveCollective",
  tiktokHook:
    "Hook: 'Three things your doctor won't tell you about working out in perimenopause.' // First 5 sec: Talking head, direct to camera, bold text overlay reading 'THE RULES CHANGED' appears at 2 sec.",
  youtubeShort:
    "Hook: 'This is why you're exhausted after workouts that used to energize you.' // Visual: Quick cuts of common workout mistakes. On-screen text: '1. Your cortisol is higher' / '2. Your recovery window is longer' / '3. Strength > cardio now.' // End card: 'Follow for more perimenopause fitness tips.'",
  linkedinPost:
    'Most fitness advice for women in their 40s is just recycled 20s-era advice.\n\nThe research tells a different story.\n\nAfter 40, the variables that predict fitness success shift — hormones, recovery time, stress load, and sleep quality become primary inputs, not afterthoughts.\n\nThe women thriving in midlife fitness aren\'t working harder. They\'re working with their biology instead of against it.\n\nWorth sharing with someone who needs to hear this.',
  facebookPost:
    "Something most women in their 40s don't hear often enough:\n\nYour body isn't failing you. Your fitness strategy just needs to evolve with you.\n\nAfter 40, hormonal shifts change what works — and what doesn't. The good news? Once you understand why, the adjustments are actually pretty simple.\n\nShare this with a friend who's been feeling stuck in her fitness routine.",
};

export const MOCK_SERIES: SeriesOverview = {
  title: '5-Day Strength After 40 Challenge',
  narrativeArc: 'Takes the audience from awareness of the problem (losing strength in midlife) through education, social proof, and a mindset shift, ending with a clear conversion moment.',
  platform: 'instagram',
  postCount: 5,
  goal: 'Educate & Build Trust',
  pillarId: 'p1',
  segmentId: 's1',
  posts: [
    {
      number: 1,
      title: 'The Strength Myth',
      role: 'Hook',
      contentType: 'Reel',
      suggestedDay: 'Mon',
      hook: "You're not getting weaker because of your age. You're getting weaker because of what you've been told about your age.",
      captionDirection: 'Challenge the myth that women lose strength inevitably after 40. Share a surprising statistic about muscle retention.',
      cta: 'Save this for Day 2 tomorrow',
      bridgeNote: 'Now that they know strength is possible, give them the move set.',
    },
    {
      number: 2,
      title: '3 Moves That Change Everything',
      role: 'Value',
      contentType: 'Carousel',
      suggestedDay: 'Tue',
      hook: 'These 3 exercises took me from exhausted to energized in 2 weeks.',
      captionDirection: 'Teach 3 beginner-friendly strength exercises with clear form cues and modifications for joint issues.',
      cta: 'Try move #1 today and tell me how it felt',
      bridgeNote: 'Reinforce the value with a real transformation story.',
    },
    {
      number: 3,
      title: "Maria's Transformation",
      role: 'Proof',
      contentType: 'Reel',
      suggestedDay: 'Wed',
      hook: 'At 52, Maria thought her body had given up on her. 90 days later, she proved everyone wrong.',
      captionDirection: 'Share a real community member transformation story with before/after mindset shift (not just physical).',
      cta: 'Drop a fire emoji if this inspires you',
      bridgeNote: 'Pivot from inspiration to the science behind why it works.',
    },
    {
      number: 4,
      title: 'What Nobody Tells You About Perimenopause & Exercise',
      role: 'Pivot',
      contentType: 'Story',
      suggestedDay: 'Thu',
      hook: "Your workout isn't failing you. Your workout doesn't know you're in perimenopause.",
      captionDirection: 'Educate on how hormonal changes require exercise adaptation. Position your program as the solution.',
      cta: 'Share this with a friend who needs to hear it',
      bridgeNote: 'Land the conversion — bring it all together with the offer.',
    },
    {
      number: 5,
      title: 'Your 7-Day Plan Is Ready',
      role: 'Conversion',
      contentType: 'Reel',
      suggestedDay: 'Fri',
      hook: "You've seen the proof. You've learned the moves. Now it's time to start.",
      captionDirection: 'Summarize the series journey, reinforce community belonging, and present the free 7-day plan as the natural next step.',
      cta: 'Click the link in bio to start your free 7-day plan',
    },
  ],
};

export const MOCK_AB_RESULT: AbAnalysisResult = {
  winner: 'A',
  confidence: 'High',
  verdict: 'Variant A leads with a stronger emotional hook, clearer benefit framing, and a more action-oriented call to action.',
  variantA: {
    strengths: [
      'Strong emotional hook in the first line',
      'Clear, specific benefit statement',
      'Action-oriented CTA tied to the benefit',
    ],
    weaknesses: ['Could be tightened by 1–2 words'],
  },
  variantB: {
    strengths: ['Good use of social proof'],
    weaknesses: [
      'Opening line buries the lede',
      'Vague CTA that does not match the offer',
      'Tone reads more corporate than human',
    ],
  },
  scores: {
    hookStrength:        { a: 8, b: 5 },
    clarity:             { a: 9, b: 6 },
    emotionalResonance:  { a: 8, b: 4 },
    ctaEffectiveness:    { a: 7, b: 5 },
  },
  improvedVersion:
    "Nobody tells active women this about training in perimenopause — and it's the reason your results stalled.\n\nIf you're in your 40s and doing everything right but seeing different results, this is for you.\n\nSwipe to see the 3 things that actually changed — and exactly what to adjust. →\n\nSave this. You'll want it.",
  improvementRationale:
    'Leads with an empowering frame, anchors the benefit with concrete social proof, and ends with a low-friction next step that matches the audience\'s intent.',
};

export const MOCK_SEO: SeoData = {
  hashtags: {
    reach:     [{ tag: '#fitness', posts: '450M' }, { tag: '#workout', posts: '320M' }, { tag: '#healthylifestyle', posts: '180M' }],
    niche:     [{ tag: '#over40fitness', posts: '2.1M' }, { tag: '#perimenopause', posts: '890K' }, { tag: '#midlifestrength', posts: '340K' }],
    community: [{ tag: '#strongafter40', posts: '120K' }, { tag: '#menopausewarrior', posts: '95K' }, { tag: '#agingwithgrace', posts: '67K' }],
  },
  keywords: ['perimenopause fitness', 'strength training women 40+', 'midlife wellness', 'hormone health exercise'],
  searchIntents: [
    'Find a coach who specializes in midlife strength training',
    'Discover hormone-aware workout routines that work after 40',
    'Connect with a community navigating perimenopause together',
  ],
  exampleBio: 'Helping women 40+ build strength, balance hormones, and thrive through perimenopause. Evidence-backed movement + community.',
  checklist: [
    { label: 'Open with primary keyword',         tip: 'Lead the first line with the term you want to rank for.' },
    { label: 'Use keyword naturally 2-3 times',   tip: 'Repeat the keyword without stuffing — keep it readable.' },
    { label: 'Include branded hashtag',           tip: 'Anchor every caption with your owned community tag.' },
    { label: 'Add location if relevant',          tip: 'Geo-tag content when location is part of the audience signal.' },
    { label: 'Front-load value in first line',    tip: 'Hook readers before the truncation cutoff.' },
    { label: 'Use alt text on all images',        tip: 'Improves accessibility and feeds platform discovery.' },
    { label: 'Include a clear CTA',               tip: 'Tell people exactly what to do next.' },
    { label: 'Mix hashtag tiers (reach + niche)', tip: 'Pair high-volume tags with focused niche tags for balanced reach.' },
  ],
  trending: [
    { title: 'Perimenopause Fitness Myths',         hook: 'Everything you were told about working out after 40 is wrong...',          virality: 'Very High' },
    { title: 'Morning Routine for Hormone Balance', hook: 'I changed one thing about my morning and my energy transformed...',         virality: 'High' },
    { title: 'Strength Training vs Cardio at 45',   hook: 'The cardio-only era is over for midlife women — here\'s why...',           virality: 'High' },
    { title: 'Recovery Days Are Training Days',     hook: 'How I doubled my strength gains by resting more (yes, really)...',          virality: 'Medium' },
  ],
};

export const MOCK_REPURPOSE_CARD_THEMES: Record<string, string> = {
  reelHooks: 'Perimenopause Fitness Reset',
  carousel: 'Hormone Health Tips',
  caption: 'Midlife Fitness Strategy',
  tiktok: 'Perimenopause Workout Reset',
  youtube: 'Post-Workout Exhaustion Fix',
  linkedin: 'Midlife Fitness Research',
  facebook: 'Fitness Strategy for Women 40+',
};
