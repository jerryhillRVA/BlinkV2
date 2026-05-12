import {
  STATUSES_BY_STAGE,
  STATUS_CONFIG,
  PIPELINE_COLUMNS,
} from './content.constants';

describe('content.constants — idea/concept new/used lifecycle (ticket #117)', () => {
  it('STATUSES_BY_STAGE.idea is exactly [new, used]', () => {
    expect(STATUSES_BY_STAGE.idea).toEqual(['new', 'used']);
  });

  it('STATUSES_BY_STAGE.concept is exactly [new, used]', () => {
    expect(STATUSES_BY_STAGE.concept).toEqual(['new', 'used']);
  });

  it('STATUSES_BY_STAGE.post is unchanged', () => {
    expect(STATUSES_BY_STAGE.post).toEqual([
      'draft',
      'in-progress',
      'review',
      'scheduled',
      'published',
    ]);
  });

  it('STATUS_CONFIG carries human labels for new and used', () => {
    expect(STATUS_CONFIG.new.label).toBe('New');
    expect(STATUS_CONFIG.used.label).toBe('Used');
  });

  it('legacy idea/concept statuses are removed from STATUS_CONFIG', () => {
    expect(
      (STATUS_CONFIG as Record<string, unknown>)['concepting'],
    ).toBeUndefined();
    expect(
      (STATUS_CONFIG as Record<string, unknown>)['posting'],
    ).toBeUndefined();
  });

  it('pipeline Ideas column filters status to ["new"]', () => {
    const col = PIPELINE_COLUMNS.find((c) => c.id === 'ideas');
    expect(col?.statuses).toEqual(['new']);
  });

  it('pipeline Concepts column filters status to ["new"]', () => {
    const col = PIPELINE_COLUMNS.find((c) => c.id === 'concepts');
    expect(col?.statuses).toEqual(['new']);
  });
});
