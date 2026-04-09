import type {
  ContentPillar,
  AudienceSegment,
  ResearchSource,
  CompetitorInsight,
  AudienceInsight,
} from './strategy-research.types';

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

export const MOCK_COMPETITOR_INSIGHTS: CompetitorInsight[] = [
  { id: 'ci1', competitor: 'Yoga with Adriene', platform: 'youtube', contentType: 'Long-form', topic: '30-day yoga journeys', relevancyLevel: 'Very High', frequency: 'Daily', insight: 'Monthly yoga challenges with daily 20-30 min videos. Strong community engagement in comments.' },
  { id: 'ci2', competitor: 'Move with Nicole', platform: 'instagram', contentType: 'Reels', topic: 'Low-impact fitness demos', relevancyLevel: 'High', frequency: '4x/week', insight: 'Short fitness demos focused on joint-friendly movements. Clear form cues and modifications.' },
  { id: 'ci3', competitor: 'The Midlife Feast', platform: 'instagram', contentType: 'Carousel', topic: 'Nutrition & recipes', relevancyLevel: 'High', frequency: '3x/week', insight: 'Recipe carousels with ingredient benefits highlighted. Anti-inflammatory foods focus.' },
  { id: 'ci4', competitor: 'Dr. Mary Claire Haver', platform: 'tiktok', contentType: 'Short-form', topic: 'Menopause education', relevancyLevel: 'Very High', frequency: '5x/week', insight: 'Myth-busting menopause content with medical expertise. Direct, science-backed tips.' },
  { id: 'ci5', competitor: 'Fit After 40', platform: 'youtube', contentType: 'Shorts', topic: 'Quick strength workouts', relevancyLevel: 'Medium', frequency: '6x/week', insight: '15-second exercise demos with clear benefits callout. Functional strength focus.' },
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
