import type { ContentItem, ContentPillar, AudienceSegment } from './content.types';

// ── Hive Collective (wellness/fitness workspace) ──

const HIVE_PILLARS: ContentPillar[] = [
  { id: 'p1', name: 'Yoga & Movement', description: 'Yoga flows, stretching routines, and mindful movement practices', color: '#d94e33' },
  { id: 'p2', name: 'Wellness & Mindfulness', description: 'Stress management, meditation, sleep, and mental health', color: '#10b981' },
  { id: 'p3', name: 'Fitness & Strength', description: 'Strength training, cardio, and fitness routines for women 40+', color: '#3b82f6' },
  { id: 'p4', name: 'Nutrition & Recipes', description: 'Healthy eating, meal prep, and nutrition for hormonal health', color: '#f59e0b' },
  { id: 'p5', name: 'Aging & Confidence', description: 'Body positivity, aging gracefully, and empowerment content', color: '#8b5cf6' },
];

const HIVE_SEGMENTS: AudienceSegment[] = [
  { id: 's1', name: 'Active 40s', description: 'Women in their 40s maintaining fitness and managing perimenopause' },
  { id: 's2', name: 'Thriving 50s', description: 'Women in their 50s focused on strength, flexibility, and menopause wellness' },
  { id: 's3', name: 'Yoga Enthusiasts', description: 'Women passionate about yoga practice and mindful movement' },
  { id: 's4', name: 'Fitness Beginners', description: 'Women new to fitness or restarting their wellness journey' },
  { id: 's5', name: 'Holistic Health Seekers', description: 'Women focused on whole-body wellness and natural living' },
];

const HIVE_ITEMS: ContentItem[] = [
  {
    id: 'idea1',
    stage: 'idea',
    status: 'draft',
    title: 'Chair Yoga Series for Office Workers',
    description: '5-part series showing simple yoga stretches that can be done at a desk or with a chair.',
    pillarIds: ['p1', 'p2'],
    segmentIds: ['s1', 's2'],
    sourceUrl: 'https://example.com/research/chair-yoga-benefits',
    attachments: [
      { name: 'chair-yoga-outline.pdf', size: '1.2 MB' },
      { name: 'reference-poses.jpg', size: '640 KB' },
    ],
    scheduledAt: '2026-05-14T09:00:00Z',
    createdAt: '2026-02-28T09:00:00',
    updatedAt: '2026-02-28T09:00:00',
  },
  { id: 'idea2', stage: 'idea', status: 'draft', title: 'Yoga Poses for Better Sleep', description: 'Evening wind-down routine with gentle poses that promote relaxation and better sleep quality.', pillarIds: ['p1', 'p5'], segmentIds: ['s3', 's5'], createdAt: '2026-02-27T14:00:00', updatedAt: '2026-02-27T14:00:00' },
  {
    id: 'idea3',
    stage: 'idea',
    status: 'draft',
    title: 'Breathwork 101: 3 Techniques for Stress Relief',
    description: 'Simple breathwork tutorial showing three foundational breathing techniques.',
    hook: 'Two minutes. One technique. Zero excuses.',
    pillarIds: ['p1', 'p5'],
    segmentIds: ['s3', 's5'],
    sourceUrl: 'https://example.com/research/breathwork-techniques',
    createdAt: '2026-02-28T11:00:00',
    updatedAt: '2026-02-28T11:00:00',
  },
  { id: 'idea4', stage: 'idea', status: 'draft', title: '10-Minute Walking Workout Challenge', description: 'Low-impact walking workout series perfect for beginners. Could be a 7-day challenge format.', pillarIds: ['p2'], segmentIds: ['s4', 's1'], createdAt: '2026-02-27T10:00:00', updatedAt: '2026-02-27T10:00:00' },
  { id: 'idea5', stage: 'idea', status: 'draft', title: 'Strength Training Myths for Women Over 40', description: 'Educational content debunking common strength training myths.', pillarIds: ['p2'], segmentIds: ['s1', 's2'], createdAt: '2026-02-28T08:00:00', updatedAt: '2026-02-28T08:00:00' },
  { id: 'concept1', stage: 'concept', status: 'draft', title: 'Morning Mobility Flow for Stiff Joints', description: 'Quick morning mobility routine targeting stiff joints and tight muscles. Walks through a 60-second daily reset you can do before coffee.', hook: 'Your body shouldn\'t feel 80 when you\'re 30. Try this 60-second morning reset.', objective: 'engagement', pillarIds: ['p1'], segmentIds: ['s4'], targetPlatforms: [{ platform: 'instagram', contentType: 'reel', postId: null }, { platform: 'tiktok', contentType: 'short-video', postId: null }], createdAt: '2026-02-20T07:00:00', updatedAt: '2026-02-24T14:00:00' },
  { id: 'concept2', stage: 'concept', status: 'draft', title: 'Anti-Inflammatory Smoothie Recipes', description: '3 quick smoothie recipes packed with turmeric, ginger, and berries for reducing inflammation. Ready in under 5 minutes, no expensive supplements needed.', hook: 'These 3 ingredients fight inflammation better than most supplements.', objective: 'education', pillarIds: ['p4'], segmentIds: ['s5', 's2'], targetPlatforms: [{ platform: 'instagram', contentType: 'carousel', postId: null }, { platform: 'youtube', contentType: 'shorts', postId: null }], createdAt: '2026-02-19T10:00:00', updatedAt: '2026-02-23T16:00:00' },
  { id: 'concept3', stage: 'concept', status: 'draft', title: 'Menopause Myth Busters Series', description: 'Short-form series tackling common menopause myths with science-backed facts.', hook: 'Everything you\'ve been told about menopause is wrong. Here\'s what the science says.', objective: 'awareness', pillarIds: ['p5', 'p2'], segmentIds: ['s2'], createdAt: '2026-02-22T09:00:00', updatedAt: '2026-02-25T11:00:00' },
  { id: 'prod1', stage: 'post', status: 'in-progress', title: '60-sec Morning Mobility Flow (No equipment)', description: 'Quick morning mobility routine designed for beginners who want equipment-free movement — ideal for stiff joints before coffee.', hook: 'Your body shouldn\'t feel 80 when you\'re 30.', objective: 'engagement', platform: 'instagram', contentType: 'reel', keyMessage: 'One 60-second daily reset is enough to undo morning stiffness.', pillarIds: ['p2'], segmentIds: ['s4'], conceptId: 'concept1', createdAt: '2026-02-20T07:00:00', updatedAt: '2026-02-26T14:00:00' },
  { id: 'prod2', stage: 'post', status: 'in-progress', title: 'Desk Neck Stretches That Actually Work', description: 'Quick neck and shoulder release for work-from-home professionals who sit all day and want fast relief between meetings.', hook: 'Your desk is destroying your neck. Fix it in 30 seconds.', objective: 'engagement', platform: 'tiktok', contentType: 'short-video', keyMessage: 'You can undo desk-induced neck tension in just 30 seconds.', pillarIds: ['p1'], segmentIds: ['s1'], createdAt: '2026-02-18T12:00:00', updatedAt: '2026-02-25T10:00:00' },
  { id: 'review1', stage: 'post', status: 'review', title: 'Bone-Strengthening Exercises for Women 50+', description: 'Weight-bearing exercise guide focusing on bone density improvement.', hook: 'These 5 exercises are your best defense against osteoporosis.', objective: 'education', platform: 'youtube', contentType: 'long-form', pillarIds: ['p3'], segmentIds: ['s2'], createdAt: '2026-02-15T08:00:00', updatedAt: '2026-02-27T09:00:00' },
  { id: 'sched1', stage: 'post', status: 'scheduled', title: 'Gut Health 101: Fermented Foods Guide', description: 'Complete guide to fermented foods and their impact on hormonal health.', hook: 'Your gut controls your hormones. Here\'s what to eat.', objective: 'education', platform: 'instagram', contentType: 'carousel', pillarIds: ['p4', 'p2'], segmentIds: ['s5'], createdAt: '2026-02-10T11:00:00', updatedAt: '2026-02-26T16:00:00' },
  { id: 'pub1', stage: 'post', status: 'published', title: '5-Minute Morning Yoga Flow', description: 'Gentle morning yoga sequence perfect for beginners starting their day.', hook: 'Start your day with just 5 minutes of movement.', objective: 'awareness', platform: 'instagram', contentType: 'reel', pillarIds: ['p1'], segmentIds: ['s3', 's4'], createdAt: '2026-02-01T06:00:00', updatedAt: '2026-02-20T10:00:00' },
  { id: 'pub2', stage: 'post', status: 'published', title: 'Meal Prep Sunday: Anti-Inflammatory Bowl', description: 'Step-by-step meal prep showing how to build an anti-inflammatory grain bowl.', hook: 'Meal prep this bowl once, eat anti-inflammatory all week.', objective: 'engagement', platform: 'instagram', contentType: 'carousel', pillarIds: ['p4'], segmentIds: ['s5', 's1'], createdAt: '2026-02-05T09:00:00', updatedAt: '2026-02-19T14:00:00' },
  { id: 'pub3', stage: 'post', status: 'published', title: 'Body Confidence at 50: Real Talk', description: 'Candid conversation about body image, aging, and redefining confidence.', hook: 'I stopped trying to look 30. Here\'s what happened.', objective: 'community', platform: 'tiktok', contentType: 'short-video', pillarIds: ['p5'], segmentIds: ['s2'], createdAt: '2026-02-08T15:00:00', updatedAt: '2026-02-22T12:00:00' },
];

// ── Booze Kills (alcohol awareness workspace) ──

const BK_PILLARS: ContentPillar[] = [
  { id: 'bk-p1', name: 'Health Impacts', description: 'Science-backed content about alcohol\'s effects on health', color: '#ef4444' },
  { id: 'bk-p2', name: 'Sober Living', description: 'Tips, stories, and resources for alcohol-free living', color: '#10b981' },
  { id: 'bk-p3', name: 'Community Stories', description: 'Real stories from people on their sobriety journey', color: '#3b82f6' },
  { id: 'bk-p4', name: 'Alternatives & Recipes', description: 'Mocktails, NA drinks, and social alternatives', color: '#f59e0b' },
];

const BK_SEGMENTS: AudienceSegment[] = [
  { id: 'bk-s1', name: 'Sober Curious', description: 'People exploring reducing or eliminating alcohol' },
  { id: 'bk-s2', name: 'Recovery Community', description: 'People actively in recovery from alcohol dependency' },
  { id: 'bk-s3', name: 'Health Conscious', description: 'Health-focused individuals interested in alcohol\'s impact' },
];

const BK_ITEMS: ContentItem[] = [
  { id: 'bk-idea1', stage: 'idea', status: 'draft', title: 'What Happens to Your Body After 30 Days Sober', description: 'Timeline of physical changes when you stop drinking for a month.', pillarIds: ['bk-p1'], segmentIds: ['bk-s1', 'bk-s3'], createdAt: '2026-03-01T09:00:00', updatedAt: '2026-03-01T09:00:00' },
  { id: 'bk-idea2', stage: 'idea', status: 'draft', title: '5 Social Situations Without Alcohol', description: 'How to navigate parties, dinners, and happy hours without drinking.', pillarIds: ['bk-p2'], segmentIds: ['bk-s1'], createdAt: '2026-03-02T10:00:00', updatedAt: '2026-03-02T10:00:00' },
  { id: 'bk-idea3', stage: 'idea', status: 'draft', title: 'The Hidden Calories in Your Drinks', description: 'Breakdown of caloric content in popular alcoholic beverages.', pillarIds: ['bk-p1', 'bk-p4'], segmentIds: ['bk-s3'], createdAt: '2026-03-03T08:00:00', updatedAt: '2026-03-03T08:00:00' },
  { id: 'bk-concept1', stage: 'concept', status: 'draft', title: 'Alcohol & Sleep: The Myth of the Nightcap', description: 'Deep dive into how alcohol disrupts sleep cycles and why the "nightcap" is counterproductive.', hook: 'That glass of wine isn\'t helping you sleep. Here\'s what it\'s actually doing.', objective: 'education', pillarIds: ['bk-p1'], segmentIds: ['bk-s1', 'bk-s3'], createdAt: '2026-02-25T11:00:00', updatedAt: '2026-02-28T15:00:00' },
  { id: 'bk-concept2', stage: 'concept', status: 'draft', title: 'Weekend Mocktail Series: Spring Edition', description: 'Three sophisticated mocktail recipes for spring entertaining.', hook: 'Your guests won\'t believe these are alcohol-free.', objective: 'engagement', pillarIds: ['bk-p4'], segmentIds: ['bk-s1'], createdAt: '2026-02-20T14:00:00', updatedAt: '2026-02-27T10:00:00' },
  { id: 'bk-prod1', stage: 'post', status: 'in-progress', title: 'How Alcohol Affects Your Gut Microbiome', description: 'Explainer on the relationship between alcohol consumption and gut health.', hook: 'Your gut bacteria are begging you to read this.', objective: 'education', platform: 'youtube', contentType: 'long-form', pillarIds: ['bk-p1'], segmentIds: ['bk-s3'], createdAt: '2026-02-15T09:00:00', updatedAt: '2026-03-01T16:00:00' },
  { id: 'bk-review1', stage: 'post', status: 'review', title: 'My First Year Sober: Real Talk', description: 'Personal story about the highs and lows of the first 365 days without alcohol.', hook: 'Nobody talks about the boring parts of getting sober.', objective: 'community', platform: 'instagram', contentType: 'carousel', pillarIds: ['bk-p3'], segmentIds: ['bk-s2'], createdAt: '2026-02-10T12:00:00', updatedAt: '2026-02-28T14:00:00' },
  { id: 'bk-sched1', stage: 'post', status: 'scheduled', title: 'NA Beer Taste Test: Top 5 Picks', description: 'Side-by-side comparison of the best non-alcoholic beers on the market.', hook: 'We tried 20 NA beers so you don\'t have to.', objective: 'engagement', platform: 'tiktok', contentType: 'short-video', pillarIds: ['bk-p4'], segmentIds: ['bk-s1'], createdAt: '2026-02-05T10:00:00', updatedAt: '2026-02-25T11:00:00' },
  { id: 'bk-pub1', stage: 'post', status: 'published', title: 'Dry January Results: What We Learned', description: 'Community roundup of Dry January experiences and health outcomes.', hook: '30 days changed everything. Here are the numbers.', objective: 'awareness', platform: 'instagram', contentType: 'reel', pillarIds: ['bk-p2', 'bk-p1'], segmentIds: ['bk-s1', 'bk-s3'], createdAt: '2026-02-01T08:00:00', updatedAt: '2026-02-15T10:00:00' },
  { id: 'bk-pub2', stage: 'post', status: 'published', title: 'The Science Behind Alcohol Cravings', description: 'Neuroscience explainer on why cravings happen and evidence-based strategies to manage them.', hook: 'Your brain isn\'t broken. Here\'s what\'s actually happening.', objective: 'education', platform: 'youtube', contentType: 'long-form', pillarIds: ['bk-p1'], segmentIds: ['bk-s2', 'bk-s3'], createdAt: '2026-01-20T09:00:00', updatedAt: '2026-02-10T14:00:00' },
];

// ── Workspace-keyed lookup ──

interface MockWorkspaceData {
  items: ContentItem[];
  pillars: ContentPillar[];
  segments: AudienceSegment[];
}

const WORKSPACE_MOCK_DATA: Record<string, MockWorkspaceData> = {
  'booze-kills': { items: BK_ITEMS, pillars: BK_PILLARS, segments: BK_SEGMENTS },
};

const DEFAULT_MOCK_DATA: MockWorkspaceData = {
  items: HIVE_ITEMS,
  pillars: HIVE_PILLARS,
  segments: HIVE_SEGMENTS,
};

export function getMockDataForWorkspace(workspaceId: string): MockWorkspaceData {
  return WORKSPACE_MOCK_DATA[workspaceId] ?? DEFAULT_MOCK_DATA;
}

// Legacy exports for tests
export const MOCK_CONTENT_ITEMS = HIVE_ITEMS;
export const MOCK_PILLARS = HIVE_PILLARS;
export const MOCK_SEGMENTS = HIVE_SEGMENTS;
