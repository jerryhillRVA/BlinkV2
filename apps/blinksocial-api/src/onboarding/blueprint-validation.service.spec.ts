import { BlueprintValidationService } from './blueprint-validation.service';
import type { BlueprintDocumentContract } from '@blinksocial/contracts';

function buildValidBlueprint(): BlueprintDocumentContract {
  return {
    clientName: 'Acme',
    deliveredDate: '2026-04-28',
    strategicSummary:
      'A long summary that spans more than a hundred characters to satisfy minLength validation guard. Core idea here.',
    businessObjectives: [
      { objective: 'Grow audience', category: 'Audience Growth', timeHorizon: '90 days', metric: '10k followers' },
      { objective: 'Boost engagement', category: 'Engagement Quality', timeHorizon: '30 days', metric: '5% rate' },
    ],
    brandVoice: {
      positioningStatement: 'For builders who think out loud.',
      contentMission: 'Demystify modern dev workflows.',
      voiceAttributes: [{ attribute: 'Direct', description: 'No fluff.' }],
      doList: ['Be specific'],
      dontList: ['Avoid jargon'],
    },
    targetAudience:
      'Independent fitness coaches building digital practices, looking for repeatable content systems.',
    audienceProfiles: [
      {
        name: 'Solo coach',
        demographics: '30-45, US, urban',
        painPoints: ['Time scarcity'],
        channels: ['Instagram'],
        contentHook: 'Show, don\'t tell',
      },
    ],
    competitorLandscape: [],
    contentPillars: [
      { name: 'Education', description: 'Teach', formats: ['Reels'], sharePercent: 50 },
      { name: 'Inspiration', description: 'Motivate', formats: ['Stories'], sharePercent: 50 },
    ],
    channelsAndCadence: [
      { channel: 'Instagram', role: 'discovery', frequency: 'daily', bestTimes: '8am', contentTypes: ['Reels'] },
    ],
    performanceScorecard: [
      { metric: 'Followers', baseline: '1k', thirtyDayTarget: '2k', ninetyDayTarget: '5k' },
      { metric: 'ER', baseline: '1%', thirtyDayTarget: '2%', ninetyDayTarget: '5%' },
      { metric: 'Reach', baseline: '5k', thirtyDayTarget: '10k', ninetyDayTarget: '25k' },
    ],
    quickWins: ['One', 'Two', 'Three'],
  };
}

describe('BlueprintValidationService', () => {
  let service: BlueprintValidationService;

  beforeEach(() => {
    service = new BlueprintValidationService();
  });

  it('accepts a complete blueprint', () => {
    const result = service.validate(buildValidBlueprint());
    expect(result).toEqual({ valid: true });
  });

  it('rejects a blueprint missing targetAudience', () => {
    const bp = buildValidBlueprint() as Partial<BlueprintDocumentContract>;
    delete bp.targetAudience;

    const result = service.validate(bp);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      const targetErr = result.errors.find((e) => e.field === '/targetAudience');
      expect(targetErr).toBeDefined();
      expect(targetErr?.message).toMatch(/required property/i);
    }
  });

  it('rejects a blueprint with too-short targetAudience', () => {
    const bp = buildValidBlueprint();
    bp.targetAudience = 'short';

    const result = service.validate(bp);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      const targetErr = result.errors.find((e) => e.field === '/targetAudience');
      expect(targetErr).toBeDefined();
      expect(targetErr?.message).toMatch(/NOT have fewer than|fewer than 50/i);
    }
  });
});
