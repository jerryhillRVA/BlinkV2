import { TestBed } from '@angular/core/testing';
import { ContentStateService } from '../../pages/content/content-state.service';
import { provideContentItemsApiStubs } from '../../pages/content/content-items-api.test-util';
import type { ContentItem } from '../../pages/content/content.types';
import { PublishTransitionService } from './publish-transition.service';

function makeItem(partial: Partial<ContentItem> = {}): ContentItem {
  const now = new Date().toISOString();
  return {
    id: 'p',
    stage: 'post',
    status: 'scheduled',
    title: 't',
    description: 'd',
    pillarIds: [],
    segmentIds: [],
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

function setup(): { svc: PublishTransitionService; state: ContentStateService } {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      ContentStateService,
      PublishTransitionService,
      ...provideContentItemsApiStubs(),
    ],
  });
  return {
    svc: TestBed.inject(PublishTransitionService),
    state: TestBed.inject(ContentStateService),
  };
}

describe('PublishTransitionService.checkAndFlip', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-16T13:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('flips a past-due scheduled item to published with a fresh publishedAt', () => {
    const { svc, state } = setup();
    // Seed with a properly-shaped scheduled item (publishAction='schedule')
    // so the normalization doesn't downgrade it on read.
    state.setItems([
      makeItem({
        id: 'a',
        scheduledAt: '2026-05-16T12:59:00.000Z',
        production: {
          qa: { publishConfig: { publishAction: 'schedule', deliveryMethod: 'auto' } },
        },
      }),
    ]);
    svc.checkAndFlip(state.items());
    const after = state.items().find((i) => i.id === 'a');
    expect(after?.status).toBe('published');
    expect(after?.publishedAt).toBe('2026-05-16T13:00:00.000Z');
  });

  it('preserves isExported across the transition (true)', () => {
    const { svc, state } = setup();
    state.setItems([
      makeItem({
        id: 'b',
        scheduledAt: '2026-05-16T12:59:00.000Z',
        isExported: true,
      }),
    ]);
    svc.checkAndFlip(state.items());
    expect(state.items().find((i) => i.id === 'b')?.isExported).toBe(true);
  });

  it('does NOT flip an item whose scheduledAt is still in the future', () => {
    const { svc, state } = setup();
    state.setItems([
      makeItem({
        id: 'c',
        scheduledAt: '2026-05-16T13:01:00.000Z',
        production: {
          qa: { publishConfig: { publishAction: 'schedule', deliveryMethod: 'auto' } },
        },
      }),
    ]);
    svc.checkAndFlip(state.items());
    expect(state.items().find((i) => i.id === 'c')?.status).toBe('scheduled');
  });

  it('does NOT flip an item without a scheduledAt', () => {
    const { svc, state } = setup();
    state.setItems([
      makeItem({
        id: 'd',
        scheduledAt: undefined,
        production: {
          qa: { publishConfig: { publishAction: 'schedule', deliveryMethod: 'auto' } },
        },
      }),
    ]);
    svc.checkAndFlip(state.items());
    // Note: status would be downgraded to 'review' by normalization since
    // it had no scheduledAt; service is a no-op regardless.
    expect(state.items().find((i) => i.id === 'd')?.status).not.toBe('published');
  });

  it('does NOT flip an already-published item', () => {
    const { svc, state } = setup();
    state.setItems([
      makeItem({
        id: 'e',
        status: 'published',
        publishedAt: '2026-01-01T00:00:00.000Z',
      }),
    ]);
    svc.checkAndFlip(state.items());
    expect(state.items().find((i) => i.id === 'e')?.publishedAt).toBe(
      '2026-01-01T00:00:00.000Z',
    );
  });

  it('skips items with an unparseable scheduledAt', () => {
    const { svc, state } = setup();
    state.setItems([
      makeItem({
        id: 'f',
        scheduledAt: 'not-a-date',
        production: {
          qa: { publishConfig: { publishAction: 'schedule', deliveryMethod: 'auto' } },
        },
      }),
    ]);
    svc.checkAndFlip(state.items());
    expect(state.items().find((i) => i.id === 'f')?.status).toBe('scheduled');
  });
});
