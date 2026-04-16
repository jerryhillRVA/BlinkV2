import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DiscoveryTabComponent } from './discovery-tab.component';
import { StrategyResearchStateService } from '../../../strategy-research-state.service';
import { ToastService } from '../../../../../core/toast/toast.service';
import { AI_SIMULATION_DELAY_MS } from '../../../strategy-research.constants';
import type {
  BusinessObjective,
  InfluencerProfile,
  ShortlistedInfluencer,
} from '../../../strategy-research.types';

describe('DiscoveryTabComponent', () => {
  let component: DiscoveryTabComponent;
  let fixture: ReturnType<typeof TestBed.createComponent<DiscoveryTabComponent>>;
  let nativeElement: HTMLElement;
  let dismissedSignal: ReturnType<typeof signal<InfluencerProfile[]>>;
  let shortlistSignal: ReturnType<typeof signal<ShortlistedInfluencer[]>>;
  let toastSpy: { showSuccess: ReturnType<typeof vi.fn>; showError: ReturnType<typeof vi.fn> };
  let stateSpy: {
    saveShortlist: ReturnType<typeof vi.fn>;
    saveDismissedInfluencers: ReturnType<typeof vi.fn>;
  };

  const objectives: BusinessObjective[] = [
    { id: 'o1', category: 'growth', statement: 'Grow', target: 100, unit: 'x', timeframe: 'Q1', status: 'on-track' },
    { id: 'o2', category: 'engagement', statement: 'Eng', target: 50, unit: 'x', timeframe: 'Q1', status: 'on-track' },
    { id: 'o3', category: 'growth', statement: 'Grow2', target: 200, unit: 'x', timeframe: 'Q1', status: 'on-track' },
  ];

  beforeEach(async () => {
    vi.useFakeTimers();
    dismissedSignal = signal<InfluencerProfile[]>([]);
    shortlistSignal = signal<ShortlistedInfluencer[]>([]);
    toastSpy = { showSuccess: vi.fn(), showError: vi.fn() };
    stateSpy = {
      saveShortlist: vi.fn((data: ShortlistedInfluencer[]) => shortlistSignal.set(data)),
      saveDismissedInfluencers: vi.fn((data: InfluencerProfile[]) => dismissedSignal.set(data)),
    };

    const mockState = {
      objectives: signal<BusinessObjective[]>(objectives),
      pillars: signal([]),
      shortlistedInfluencers: shortlistSignal,
      dismissedInfluencers: dismissedSignal,
      saveShortlist: stateSpy.saveShortlist,
      saveDismissedInfluencers: stateSpy.saveDismissedInfluencers,
    };

    await TestBed.configureTestingModule({
      imports: [DiscoveryTabComponent],
      providers: [
        { provide: StrategyResearchStateService, useValue: mockState },
        { provide: ToastService, useValue: toastSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DiscoveryTabComponent);
    component = fixture.componentInstance;
    nativeElement = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => vi.useRealTimers());

  it('creates and shows empty state initially', () => {
    expect(component).toBeTruthy();
    expect(nativeElement.querySelector('.discovery__empty')).toBeTruthy();
  });

  it('renders unique objective categories in context strip', () => {
    const chips = nativeElement.querySelectorAll('.discovery__context-chip');
    expect(chips).toHaveLength(2);
  });

  it('findInfluencers populates results after delay', () => {
    component.findInfluencers();
    expect(component.isDiscovering()).toBe(true);
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    expect(component.isDiscovering()).toBe(false);
    expect(component.hasSearched()).toBe(true);
    expect(component.totalDiscovered().length).toBeGreaterThan(0);
    expect(toastSpy.showSuccess).toHaveBeenCalled();
  });

  it('applies platform filter when set', () => {
    component.togglePlatform('instagram');
    expect(component.isPlatformActive('instagram')).toBe(true);
    component.findInfluencers();
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    expect(component.totalDiscovered().every((p) => p.platforms.includes('instagram'))).toBe(true);
    component.togglePlatform('instagram');
    expect(component.isPlatformActive('instagram')).toBe(false);
  });

  it('applies tier filter when set', () => {
    component.toggleTier('micro');
    component.findInfluencers();
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    expect(component.totalDiscovered().every((p) => p.tier === 'micro')).toBe(true);
    component.toggleTier('micro');
    expect(component.isTierActive('micro')).toBe(false);
  });

  it('keyword filter narrows visible results', () => {
    component.findInfluencers();
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    const first = component.totalDiscovered()[0];
    component.onKeywordChange(first.name.split(' ')[0]);
    expect(component.filteredSorted().length).toBeGreaterThan(0);
    component.onKeywordChange('definitely-no-match-xyz-query');
    expect(component.filteredSorted().length).toBe(0);
  });

  it('no-matches state with a keyword shows the keyword and a clear button that resets it', () => {
    component.findInfluencers();
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    component.onKeywordChange('definitely-no-match-xyz-query');
    fixture.detectChanges();
    const noMatches = nativeElement.querySelector('.discovery__no-matches');
    expect(noMatches?.textContent).toContain('definitely-no-match-xyz-query');
    const clearBtn = nativeElement.querySelector<HTMLButtonElement>('.discovery__no-matches-clear');
    expect(clearBtn).toBeTruthy();
    clearBtn?.click();
    expect(component.keyword()).toBe('');
  });

  it('no-matches state without a keyword shows the generic fallback copy', () => {
    component.findInfluencers();
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    // Force zero results without keyword by filtering to a nonexistent tier combo
    component.totalDiscovered.set([]);
    fixture.detectChanges();
    const noMatches = nativeElement.querySelector('.discovery__no-matches');
    expect(noMatches?.textContent?.trim()).toBe('No matches. Try broadening your filters.');
  });

  it('setSort toggles direction or changes key', () => {
    component.setSort('audienceAlignment');
    expect(component.sortDir()).toBe('asc');
    component.setSort('followers');
    expect(component.sortBy()).toBe('followers');
    expect(component.sortDir()).toBe('desc');
    component.setSort('tier');
    expect(component.sortBy()).toBe('tier');
  });

  it('pagination navigates through pages', () => {
    component.findInfluencers();
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    if (component.totalPages() > 1) {
      component.nextPage();
      expect(component.currentPage()).toBe(2);
      component.prevPage();
      expect(component.currentPage()).toBe(1);
    }
    component.setPageMode('all');
    expect(component.pageMode()).toBe('all');
  });

  it('addToShortlist saves via state and shows toast', () => {
    component.findInfluencers();
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    const profile = component.totalDiscovered()[0];
    component.addToShortlist(profile);
    expect(stateSpy.saveShortlist).toHaveBeenCalled();
    expect(toastSpy.showSuccess).toHaveBeenCalledWith('Added to shortlist');
  });

  it('addToShortlist is a no-op when already shortlisted', () => {
    component.findInfluencers();
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    const profile = component.totalDiscovered()[0];
    component.addToShortlist(profile);
    stateSpy.saveShortlist.mockClear();
    component.addToShortlist(profile);
    expect(stateSpy.saveShortlist).not.toHaveBeenCalled();
  });

  it('dismissProfile removes from results and persists', () => {
    component.findInfluencers();
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    const profile = component.totalDiscovered()[0];
    const before = component.totalDiscovered().length;
    component.dismissProfile(profile);
    expect(component.totalDiscovered().length).toBe(before - 1);
    expect(stateSpy.saveDismissedInfluencers).toHaveBeenCalled();
  });

  it('restoreOne restores from dismissed set', () => {
    const profile: InfluencerProfile = {
      id: 'x', name: 'Test User', handle: '@test', platforms: ['instagram'],
      tier: 'micro', followers: 10000, engagementRate: 5, niche: ['test'],
      audienceAlignment: 70, objectiveFit: [], bio: 'bio', avatarColor: '#000',
    };
    dismissedSignal.set([profile]);
    component.restoreOne(profile);
    expect(stateSpy.saveDismissedInfluencers).toHaveBeenCalledWith([]);
  });

  it('restoreAll clears dismissed set', () => {
    component.restoreAll();
    expect(stateSpy.saveDismissedInfluencers).toHaveBeenCalledWith([]);
  });

  it('toggleDismissedPanel flips showDismissed', () => {
    expect(component.showDismissed()).toBe(false);
    component.toggleDismissedPanel();
    expect(component.showDismissed()).toBe(true);
    component.toggleDismissedPanel();
    expect(component.showDismissed()).toBe(false);
  });

  it('exposes a reactive shortlistedHandles signal that updates after addToShortlist', () => {
    component.findInfluencers();
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    const profile = component.totalDiscovered()[0];
    expect(component.shortlistedHandles().has(profile.handle)).toBe(false);
    component.addToShortlist(profile);
    expect(component.shortlistedHandles().has(profile.handle)).toBe(true);
  });

  it('isShortlisted returns true when profile is on the shortlist', () => {
    shortlistSignal.set([{
      id: 'x', name: 'Test', handle: '@test', platforms: ['instagram'],
      tier: 'micro', followers: 10000, engagementRate: 5, niche: [],
      audienceAlignment: 70, objectiveFit: [], bio: '', avatarColor: '#000',
      status: 'new', addedAt: '2026-01-01T00:00:00Z',
    }]);
    expect(component.isShortlisted('@test')).toBe(true);
    expect(component.isShortlisted('@notfound')).toBe(false);
  });

  it('onOutreach emits event', () => {
    const spy = vi.fn();
    component.outreach.subscribe(spy);
    const profile: InfluencerProfile = {
      id: 'x', name: 'Test', handle: '@test', platforms: ['instagram'],
      tier: 'micro', followers: 10000, engagementRate: 5, niche: [],
      audienceAlignment: 70, objectiveFit: [], bio: '', avatarColor: '#000',
    };
    component.onOutreach(profile);
    expect(spy).toHaveBeenCalledWith(profile);
  });

  it('helper dismissedInitials and dismissedFollowersLabel work', () => {
    expect(component.dismissedInitials('Maya Chen')).toBe('MC');
    expect(component.dismissedFollowersLabel(48200)).toBe('48.2K');
  });

  it('range and paged computeds handle empty list and all modes', () => {
    expect(component.totalPages()).toBe(1);
    expect(component.rangeStart()).toBe(0);
    expect(component.rangeEnd()).toBe(0);
    expect(component.paged()).toEqual([]);
    component.findInfluencers();
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    component.setPageMode('all');
    expect(component.rangeStart()).toBe(1);
    expect(component.rangeEnd()).toBe(component.filteredSorted().length);
    expect(component.paged()).toEqual(component.filteredSorted());
  });

  it('setSort toggles dir back from asc to desc on same key', () => {
    component.setSort('audienceAlignment');
    expect(component.sortDir()).toBe('asc');
    component.setSort('audienceAlignment');
    expect(component.sortDir()).toBe('desc');
  });

  it('toggleSortDir flips direction without changing the sort key', () => {
    component.setSort('followers');
    expect(component.sortBy()).toBe('followers');
    expect(component.sortDir()).toBe('desc');
    component.toggleSortDir();
    expect(component.sortBy()).toBe('followers');
    expect(component.sortDir()).toBe('asc');
    component.toggleSortDir();
    expect(component.sortDir()).toBe('desc');
  });

  it('dismissProfile adjusts currentPage when page becomes empty', () => {
    component.findInfluencers();
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    component.setPageMode(25);
    const total = component.totalDiscovered();
    component.totalDiscovered.set(total.slice(0, 26));
    component.currentPage.set(2);
    component.dismissProfile(component.totalDiscovered()[25]);
    expect(component.currentPage()).toBeLessThanOrEqual(component.totalPages());
  });

  it('filters out shortlisted and dismissed handles when finding', () => {
    const existing: InfluencerProfile = {
      id: 'x', name: 'Existing', handle: '@exists', platforms: ['instagram'],
      tier: 'micro', followers: 1000, engagementRate: 1, niche: [],
      audienceAlignment: 70, objectiveFit: [], bio: '', avatarColor: '#000',
    };
    dismissedSignal.set([existing]);
    component.findInfluencers();
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    expect(component.totalDiscovered().some((p) => p.handle === '@exists')).toBe(false);
  });
});
