import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { ContentItem, ContentPillar } from '../../../content.types';
import { PipelineCardScheduledComponent } from './pipeline-card-scheduled.component';

function makeItem(partial: Partial<ContentItem> = {}): ContentItem {
  const now = new Date().toISOString();
  return {
    id: 'post-1',
    stage: 'post',
    status: 'scheduled',
    title: 'My scheduled post',
    description: 'desc',
    pillarIds: [],
    segmentIds: [],
    platform: 'instagram',
    contentType: 'reel',
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

function setup(
  item: ContentItem = makeItem(),
  pillars: ReadonlyArray<{ id: string; name: string }> = [],
): ComponentFixture<PipelineCardScheduledComponent> {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ imports: [PipelineCardScheduledComponent] });
  const fixture = TestBed.createComponent(PipelineCardScheduledComponent);
  fixture.componentRef.setInput('item', item);
  fixture.componentRef.setInput('pillarNames', pillars);
  fixture.detectChanges();
  return fixture;
}

describe('PipelineCardScheduledComponent', () => {
  it('renders the blue Scheduled status pill', () => {
    const fixture = setup();
    const pill = fixture.nativeElement.querySelector('[data-pill="scheduled"]') as HTMLElement;
    expect(pill).not.toBeNull();
    expect(pill.textContent?.trim()).toContain('Scheduled');
  });

  it('renders the title (2-line clamp class applied)', () => {
    const fixture = setup(makeItem({ title: 'Hello world' }));
    const title = fixture.nativeElement.querySelector('.sc-title') as HTMLElement;
    expect(title.textContent?.trim()).toBe('Hello world');
  });

  it('formats scheduledAt as a friendly date', () => {
    const fixture = setup(makeItem({ scheduledAt: '2099-01-15T15:30:00.000Z' }));
    const meta = fixture.nativeElement.querySelector('.sc-meta-label') as HTMLElement;
    // Loose match — exact wording depends on the test runner's locale, but
    // a 4-digit year + the day number should always appear.
    expect(meta.textContent).toMatch(/2099|Jan|15/);
  });

  it('renders "No date set" when scheduledAt is missing', () => {
    const fixture = setup(makeItem({ scheduledAt: null as unknown as string }));
    expect(fixture.nativeElement.querySelector('.sc-meta-label')?.textContent?.trim()).toBe(
      'No date set',
    );
  });

  it('renders the Exported pill only when isExported=true', () => {
    const fixtureA = setup(makeItem({ isExported: false }));
    expect(fixtureA.nativeElement.querySelector('[data-pill="exported"]')).toBeNull();
    const fixtureB = setup(makeItem({ isExported: true }));
    expect(fixtureB.nativeElement.querySelector('[data-pill="exported"]')).not.toBeNull();
  });

  it('renders only known pillar names (up to 2)', () => {
    const pillars: ContentPillar[] = [
      { id: 'p1', name: 'Wellness', description: '', color: '#000' },
      { id: 'p2', name: 'Mindfulness', description: '', color: '#000' },
      { id: 'p3', name: 'Yoga', description: '', color: '#000' },
    ];
    const fixture = setup(
      makeItem({ pillarIds: ['p1', 'p2', 'p3', 'p-unknown'] }),
      pillars,
    );
    const badges = fixture.nativeElement.querySelectorAll('.pillar-badge');
    expect(badges.length).toBe(2);
    expect(badges[0].textContent?.trim()).toBe('Wellness');
    expect(badges[1].textContent?.trim()).toBe('Mindfulness');
  });

  it('emits opened on card click', () => {
    const fixture = setup();
    let count = 0;
    fixture.componentInstance.opened.subscribe(() => count++);
    (fixture.nativeElement.querySelector('.card-scheduled') as HTMLButtonElement).dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    );
    fixture.detectChanges();
    expect(count).toBe(1);
  });

  it('omits the platform row when platform is unset', () => {
    const fixture = setup(makeItem({ platform: undefined }));
    expect(fixture.nativeElement.querySelector('.sc-platform')).toBeNull();
  });

  // #146 — warning indicator on Export-Packet-scheduled items
  it('renders the AlertTriangle warning when isExported && !livePostUrl', () => {
    const fixture = setup(makeItem({ isExported: true, livePostUrl: undefined }));
    expect(fixture.nativeElement.querySelector('[data-pill="warning"]')).not.toBeNull();
  });

  it('does NOT render warning when livePostUrl is set', () => {
    const fixture = setup(makeItem({ isExported: true, livePostUrl: 'https://x' }));
    expect(fixture.nativeElement.querySelector('[data-pill="warning"]')).toBeNull();
  });

  it('does NOT render warning when isExported is false', () => {
    const fixture = setup(makeItem({ isExported: false }));
    expect(fixture.nativeElement.querySelector('[data-pill="warning"]')).toBeNull();
  });
});
