import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FlagsCardComponent } from './flags-card.component';
import { PostDetailStore } from '../../../post-detail.store';
import { ContentStateService } from '../../../../../content-state.service';
import { provideContentItemsApiStubs } from '../../../../../content-items-api.test-util';
import type { ContentItem } from '../../../../../content.types';

function makeItem(partial: Partial<ContentItem> = {}): ContentItem {
  const now = new Date().toISOString();
  return {
    id: 'post-1',
    stage: 'post',
    status: 'in-progress',
    title: 'P',
    description: 'x'.repeat(80),
    pillarIds: ['p1'],
    segmentIds: ['s1'],
    platform: 'instagram',
    contentType: 'reel',
    keyMessage: 'set',
    owner: 'user-sarah',
    cta: { type: 'learn-more', text: 'go' },
    briefApproved: true,
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

function setup(item: ContentItem = makeItem()): {
  fixture: ComponentFixture<FlagsCardComponent>;
  store: PostDetailStore;
} {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [FlagsCardComponent],
    providers: [
      ...provideContentItemsApiStubs(),
      ContentStateService,
      PostDetailStore,
    ],
  });
  TestBed.inject(ContentStateService).setItems([item]);
  const store = TestBed.inject(PostDetailStore);
  store.setItemId(item.id);
  const fixture = TestBed.createComponent(FlagsCardComponent);
  fixture.detectChanges();
  return { fixture, store };
}

describe('FlagsCardComponent', () => {
  it('renders the collapsed header with the Flags title', () => {
    const { fixture } = setup();
    const toggle = fixture.nativeElement.querySelector('.flags-toggle');
    expect(toggle.textContent).toContain('Flags');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(fixture.nativeElement.querySelector('.flags-grid')).toBeNull();
  });

  it('clicking the header toggles aria-expanded and reveals the grid', () => {
    const { fixture } = setup();
    const toggle = fixture.nativeElement.querySelector('.flags-toggle') as HTMLButtonElement;
    toggle.click();
    fixture.detectChanges();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(fixture.nativeElement.querySelector('.flags-grid')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('.flag-cell').length).toBe(4);
  });

  it('shows the "N active" badge only when at least one flag is on', () => {
    const noFlags = setup(makeItem({
      production: { brief: { needsAccessibility: false } },
    }));
    expect(noFlags.fixture.nativeElement.querySelector('.flags-active-badge')).toBeNull();
    // Accessibility defaults to true → 1 active
    const defaultA11y = setup(makeItem());
    const badge = defaultA11y.fixture.nativeElement.querySelector('.flags-active-badge');
    expect(badge.textContent).toContain('1 active');
  });

  it('each flag cell has an aria-labeled switch button with role="switch"', () => {
    const { fixture } = setup();
    (fixture.nativeElement.querySelector('.flags-toggle') as HTMLButtonElement).click();
    fixture.detectChanges();
    const switches = fixture.nativeElement.querySelectorAll('[role="switch"]');
    expect(switches.length).toBe(4);
    const labels = Array.from(switches as NodeListOf<Element>).map((s) =>
      s.getAttribute('aria-label'),
    );
    expect(labels).toEqual([
      'Toggle Contains claims',
      'Toggle Has talent/faces',
      'Toggle Uses music',
      'Toggle Accessibility',
    ]);
  });

  it('toggling a switch routes to the corresponding store setter and updates aria-checked', () => {
    const { fixture, store } = setup();
    (fixture.nativeElement.querySelector('.flags-toggle') as HTMLButtonElement).click();
    fixture.detectChanges();
    const claimsSwitch = fixture.nativeElement.querySelector(
      '[aria-label="Toggle Contains claims"]',
    ) as HTMLButtonElement;
    expect(claimsSwitch.getAttribute('aria-checked')).toBe('false');
    claimsSwitch.click();
    fixture.detectChanges();
    expect(claimsSwitch.getAttribute('aria-checked')).toBe('true');
    expect(store.hasClaims()).toBe(true);
  });

  it('flags persist even when briefApproved=true (no write-lock)', () => {
    // Brief flags are editable post-approval because compliance state
    // can change during production. Specifically test this.
    const { fixture, store } = setup(makeItem({ briefApproved: true }));
    (fixture.nativeElement.querySelector('.flags-toggle') as HTMLButtonElement).click();
    fixture.detectChanges();
    fixture.componentInstance['onToggle']('hasMusic');
    expect(store.hasMusic()).toBe(true);
    fixture.componentInstance['onToggle']('hasTalent');
    expect(store.hasTalent()).toBe(true);
  });

  it('Accessibility defaults to true (needsAccessibility !== false)', () => {
    const { store } = setup(makeItem({ production: { brief: {} } }));
    expect(store.needsAccessibility()).toBe(true);
    const offFromExplicitFalse = setup(makeItem({
      production: { brief: { needsAccessibility: false } },
    }));
    expect(offFromExplicitFalse.store.needsAccessibility()).toBe(false);
  });

  it('activeFlagCount sums currently-on flags', () => {
    const { store } = setup(makeItem({
      production: {
        brief: {
          hasMusic: true,
          hasTalent: true,
          // needsAccessibility omitted → defaults to true (active)
          compliance: { containsClaims: false },
        },
      },
    }));
    expect(store.activeFlagCount()).toBe(3); // music + talent + a11y
  });

  it('hint text differs for accessibility on vs off', () => {
    const { fixture, store } = setup(makeItem({
      production: { brief: { needsAccessibility: false } },
    }));
    (fixture.nativeElement.querySelector('.flags-toggle') as HTMLButtonElement).click();
    fixture.detectChanges();
    const a11yCell = fixture.nativeElement.querySelectorAll('.flag-cell')[3];
    expect(a11yCell.querySelector('.flag-hint').textContent).toContain('Not required');
    // Flip on
    store.setNeedsAccessibility(true);
    fixture.detectChanges();
    expect(a11yCell.querySelector('.flag-hint').textContent).toContain(
      'Captions / alt text required',
    );
  });
});
