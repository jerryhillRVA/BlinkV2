import type { BlueprintDocumentContract } from '@blinksocial/contracts';

/**
 * Canonical fully-populated `BlueprintDocumentContract` fixture used by:
 *  - the shared serializer's own unit tests
 *  - the heading-coverage regression test that diffs the rendered output
 *    against `blueprint-template.md`
 *  - both consumer specs (`onboarding.service.spec.ts` and
 *    `onboard-state.service.spec.ts`) — keeps them from drifting on schema
 *    changes by importing instead of re-declaring
 *
 * Every field on the contract is non-empty so the rendered output is
 * structurally complete and the AJV schema validates without errors. Tests
 * that need to exercise placeholder/missing-field paths spread this object
 * and override the fields they care about.
 */
export function buildSampleBlueprint(): BlueprintDocumentContract {
  return {
    clientName: 'Acme',
    deliveredDate: '2026-04-29',
    strategicSummary:
      'A long summary that spans more than a hundred characters to satisfy minLength validation guard. Core idea here.',
    strategyInPlainEnglish:
      'Show up where the buyer already is, prove the craft, then convert.',
    strategicDecisions:
      'Lead with strength training over yoga; optimize for saves over follows; default to short-form on TikTok before IG.',
    businessObjectives: [
      {
        objective: 'Grow audience',
        category: 'Audience Growth',
        timeHorizon: '90 days',
        metric: '10k followers',
      },
      {
        objective: 'Boost engagement',
        category: 'Engagement Quality',
        timeHorizon: '30 days',
        metric: '5% rate',
      },
    ],
    objectivesShapeContent:
      'Audience Growth funds Engagement Quality: every educational reel routes to a save-driving CTA, while community posts close the conversion loop.',
    brandVoice: {
      positioningStatement: 'For builders who think out loud.',
      contentMission: 'Demystify modern dev workflows.',
      voiceAttributes: [{ attribute: 'Direct', description: 'No fluff.' }],
      doList: ['Be specific'],
      dontList: ['Avoid jargon'],
      voiceInAction: [
        { context: 'Reel caption', sample: 'You do not need 60 minutes — you need 12 honest ones.' },
        { context: 'Email subject', sample: 'The five-minute strength habit that survives bad weeks.' },
        { context: 'DM reply', sample: 'Saved this one for me — what stopped you from starting?' },
      ],
    },
    targetAudience:
      'Independent fitness coaches building digital practices and looking for repeatable content systems.',
    audienceProfiles: [
      {
        name: 'Solo coach',
        demographics: '30-45, US, urban',
        painPoints: ['Time'],
        channels: ['Instagram'],
        contentHook: "Show, don't tell",
        journeyMap: [
          {
            phase: 'Discovery',
            goal: 'Find a coach who looks like them',
            contentMoment: 'Reel: 3-second hook + form demo',
          },
          {
            phase: 'Consideration',
            goal: 'Trust the method',
            contentMoment: 'Carousel: weekly programming explained',
          },
          {
            phase: 'Conversion',
            goal: 'Take the first session',
            contentMoment: 'Story link: free starter plan',
          },
          {
            phase: 'Advocate',
            goal: 'Share progress publicly',
            contentMoment: 'UGC repost + DM reply thread',
          },
        ],
      },
    ],
    competitorLandscape: [
      {
        name: 'Silver Highlights',
        platforms: ['IG'],
        strengths: ['Talks straight to camera'],
        gaps: ['Audience over 60 only'],
        relevancy: 'Adjacent',
      },
    ],
    differentiationMatrix: [
      {
        dimension: 'Audience specificity',
        hive: 'Women 40+ just getting started',
        competitors: [
          { name: 'Silver Highlights', value: '60+ only' },
          { name: 'Carolines Circuits', value: 'General fitness' },
        ],
      },
      {
        dimension: 'Tone',
        hive: 'Lighthearted, friend-like',
        competitors: [
          { name: 'Silver Highlights', value: 'Earnest' },
          { name: 'Carolines Circuits', value: 'Polished' },
        ],
      },
      {
        dimension: 'Format mix',
        hive: 'Short-form + long-form coaching',
        competitors: [
          { name: 'Silver Highlights', value: 'Short-form only' },
          { name: 'Carolines Circuits', value: 'Pre-produced workouts' },
        ],
      },
    ],
    differentiationSummary:
      'Hive owns the "starter for women 40+" lane: warmer than the polished competitors, more specific than the generic ones.',
    contentPillars: [
      {
        name: 'Education',
        description: 'Teach',
        formats: ['Reels'],
        sharePercent: 50,
        contentIdeas: [
          { title: 'Three lifts that fix posture in 4 weeks', angle: 'Form-first, before/after demo' },
          { title: 'Why your knees hurt on stairs (and how to fix it)', angle: 'Pain → cause → drill' },
          { title: 'The protein math nobody told you', angle: 'Plate-by-plate breakdown' },
          { title: 'What "progressive overload" actually means', angle: 'Day-1 friendly explainer' },
          { title: 'Five-minute mobility before coffee', angle: 'Habit-stacking demo' },
        ],
      },
      {
        name: 'Inspiration',
        description: 'Motivate',
        formats: ['Stories'],
        sharePercent: 50,
        contentIdeas: [
          { title: 'I started at 47 — here is week 1 vs week 12', angle: 'Honest progress reel' },
          { title: 'The day I stopped apologizing for the gym', angle: 'Talking-head story' },
          { title: 'My client Maria, 52, deadlifted 135', angle: 'Permission-giving moment' },
          { title: 'What changed when I quit hating my body', angle: 'Voice-over carousel' },
          { title: 'How to start when nobody is cheering', angle: 'Starter pep-talk' },
        ],
      },
    ],
    channelsAndCadence: [
      {
        channel: 'Instagram',
        role: 'discovery',
        frequency: 'daily',
        bestTimes: '8am',
        contentTypes: ['Reels'],
      },
    ],
    contentChannelMatrix: [
      {
        pillar: 'Education',
        placements: [
          { channel: 'Instagram', role: 'primary' },
          { channel: 'TikTok', role: 'occasional' },
        ],
      },
      {
        pillar: 'Inspiration',
        placements: [
          { channel: 'Instagram', role: 'occasional' },
          { channel: 'TikTok', role: 'primary' },
        ],
      },
    ],
    performanceScorecard: [
      {
        metric: 'Followers',
        baseline: '1k',
        thirtyDayTarget: '2k',
        ninetyDayTarget: '5k',
        definition: 'Total followers across primary channels.',
      },
      {
        metric: 'ER',
        baseline: '1%',
        thirtyDayTarget: '2%',
        ninetyDayTarget: '5%',
        definition: 'Engagement rate on top-of-feed posts.',
      },
      {
        metric: 'Reach',
        baseline: '5k',
        thirtyDayTarget: '10k',
        ninetyDayTarget: '25k',
        definition: 'Unique accounts reached per week.',
      },
    ],
    reviewCadence:
      'Weekly check-ins on Mondays. 30-day pulse with the strategist. 90-day strategic review with full report.',
    quickWins: ['One', 'Two', 'Three'],
  };
}
