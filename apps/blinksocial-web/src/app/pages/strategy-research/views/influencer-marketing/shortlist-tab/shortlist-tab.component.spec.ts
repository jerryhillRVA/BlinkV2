import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ShortlistTabComponent } from './shortlist-tab.component';
import { StrategyResearchStateService } from '../../../strategy-research-state.service';
import { ToastService } from '../../../../../core/toast/toast.service';
import type { ShortlistedInfluencer } from '../../../strategy-research.types';

describe('ShortlistTabComponent', () => {
  let component: ShortlistTabComponent;
  let fixture: ReturnType<typeof TestBed.createComponent<ShortlistTabComponent>>;
  let nativeElement: HTMLElement;
  let shortlistSignal: ReturnType<typeof signal<ShortlistedInfluencer[]>>;
  let saveSpy: ReturnType<typeof vi.fn>;
  let toastSpy: { showSuccess: ReturnType<typeof vi.fn>; showError: ReturnType<typeof vi.fn> };

  const sample: ShortlistedInfluencer = {
    id: 'inf-1', name: 'Maya Chen', handle: '@mayachen',
    platforms: ['instagram', 'tiktok'], tier: 'micro',
    followers: 48200, engagementRate: 5.8, niche: ['fitness'],
    audienceAlignment: 89, objectiveFit: ['growth'], bio: '',
    avatarColor: '#6366f1', status: 'new', addedAt: '2026-04-14T00:00:00Z',
  };

  beforeEach(async () => {
    shortlistSignal = signal<ShortlistedInfluencer[]>([sample]);
    saveSpy = vi.fn((data: ShortlistedInfluencer[]) => shortlistSignal.set(data));
    toastSpy = { showSuccess: vi.fn(), showError: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [ShortlistTabComponent],
      providers: [
        { provide: StrategyResearchStateService, useValue: { shortlistedInfluencers: shortlistSignal, saveShortlist: saveSpy } },
        { provide: ToastService, useValue: toastSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ShortlistTabComponent);
    component = fixture.componentInstance;
    nativeElement = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('creates', () => expect(component).toBeTruthy());

  it('renders one row per entry', () => {
    expect(nativeElement.querySelectorAll('.shortlist__row')).toHaveLength(1);
  });

  it('shows empty state when list is empty', () => {
    shortlistSignal.set([]);
    fixture.detectChanges();
    expect(nativeElement.querySelector('.shortlist__empty')).toBeTruthy();
  });

  it('updateStatus saves with new status and shows toast', () => {
    component.updateStatus('@mayachen', 'contacted');
    expect(saveSpy).toHaveBeenCalledWith([expect.objectContaining({ status: 'contacted' })]);
    expect(toastSpy.showSuccess).toHaveBeenCalledWith('Status updated');
  });

  it('remove filters out the entry and persists', () => {
    component.remove('@mayachen');
    expect(saveSpy).toHaveBeenCalledWith([]);
    expect(toastSpy.showSuccess).toHaveBeenCalledWith('Removed from shortlist');
  });

  it('draftOutreach emits openOutreach event', () => {
    const spy = vi.fn();
    component.openOutreach.subscribe(spy);
    component.draftOutreach(sample);
    expect(spy).toHaveBeenCalledWith(sample);
  });

  it('createBrief emits openBrief event', () => {
    const spy = vi.fn();
    component.openBrief.subscribe(spy);
    component.createBrief(sample);
    expect(spy).toHaveBeenCalledWith(sample);
  });

  it('helpers compute follower label and initials', () => {
    expect(component.followersLabel(48200)).toBe('48.2K');
    expect(component.initials('Maya Chen')).toBe('MC');
  });
});
