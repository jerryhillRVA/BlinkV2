import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CampaignsTabComponent } from './campaigns-tab.component';
import { StrategyResearchStateService } from '../../../strategy-research-state.service';
import { ToastService } from '../../../../../core/toast/toast.service';
import type {
  BusinessObjective,
  InfluencerCampaign,
  ShortlistedInfluencer,
} from '../../../strategy-research.types';

describe('CampaignsTabComponent', () => {
  let component: CampaignsTabComponent;
  let fixture: ReturnType<typeof TestBed.createComponent<CampaignsTabComponent>>;
  let campaignsSignal: ReturnType<typeof signal<InfluencerCampaign[]>>;
  let shortlistSignal: ReturnType<typeof signal<ShortlistedInfluencer[]>>;
  let saveCampaigns: ReturnType<typeof vi.fn>;
  let toastSpy: { showSuccess: ReturnType<typeof vi.fn>; showError: ReturnType<typeof vi.fn> };

  const influencer: ShortlistedInfluencer = {
    id: 'inf-1', name: 'Maya Chen', handle: '@mayachen',
    platforms: ['instagram', 'tiktok'], tier: 'micro',
    followers: 48200, engagementRate: 5.8, niche: [],
    audienceAlignment: 89, objectiveFit: [], bio: '',
    avatarColor: '#000', status: 'new', addedAt: '2026-01-01T00:00:00Z',
  };

  const objectives: BusinessObjective[] = [
    { id: 'o1', category: 'growth', statement: 'Grow', target: 100, unit: 'x', timeframe: 'Q1', status: 'on-track' },
  ];

  beforeEach(async () => {
    vi.useFakeTimers();
    campaignsSignal = signal<InfluencerCampaign[]>([]);
    shortlistSignal = signal<ShortlistedInfluencer[]>([influencer]);
    saveCampaigns = vi.fn((data: InfluencerCampaign[]) => campaignsSignal.set(data));
    toastSpy = { showSuccess: vi.fn(), showError: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [CampaignsTabComponent],
      providers: [
        {
          provide: StrategyResearchStateService,
          useValue: {
            influencerCampaigns: campaignsSignal,
            shortlistedInfluencers: shortlistSignal,
            objectives: signal<BusinessObjective[]>(objectives),
            saveCampaigns,
          },
        },
        { provide: ToastService, useValue: toastSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CampaignsTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => vi.useRealTimers());

  it('creates with empty state', () => {
    expect(component).toBeTruthy();
    const native: HTMLElement = fixture.nativeElement;
    expect(native.querySelector('.campaigns__empty')).toBeTruthy();
  });

  it('toggleAddForm opens/closes and resets state on close', () => {
    component.toggleAddForm();
    expect(component.showAddForm()).toBe(true);
    component.updateAddField('campaignName', 'Test');
    component.toggleAddForm();
    expect(component.showAddForm()).toBe(false);
    expect(component.addForm().campaignName).toBe('');
  });

  it('setAddInfluencer populates platforms from shortlist', () => {
    component.toggleAddForm();
    component.setAddInfluencer('@mayachen');
    expect(component.addForm().influencerHandle).toBe('@mayachen');
    expect(component.addForm().platforms).toEqual(['instagram', 'tiktok']);
  });

  it('toggleAddPlatform removes and adds platforms', () => {
    component.toggleAddForm();
    component.setAddInfluencer('@mayachen');
    component.toggleAddPlatform('instagram');
    expect(component.isAddPlatformActive('instagram')).toBe(false);
    component.toggleAddPlatform('instagram');
    expect(component.isAddPlatformActive('instagram')).toBe(true);
  });

  it('canSaveNewCampaign requires name and influencer', () => {
    expect(component.canSaveNewCampaign()).toBe(false);
    component.updateAddField('campaignName', 'Launch');
    expect(component.canSaveNewCampaign()).toBe(false);
    component.setAddInfluencer('@mayachen');
    expect(component.canSaveNewCampaign()).toBe(true);
  });

  it('saveNewCampaign persists and closes form', () => {
    component.toggleAddForm();
    component.updateAddField('campaignName', 'Spring Launch');
    component.setAddInfluencer('@mayachen');
    component.updateAddField('objectiveId', 'o1');
    component.saveNewCampaign();
    expect(saveCampaigns).toHaveBeenCalled();
    expect(component.showAddForm()).toBe(false);
    const saved = saveCampaigns.mock.calls[0][0][0];
    expect(saved.name).toBe('Spring Launch');
    expect(saved.objectiveStatement).toBe('Grow');
    expect(saved.metrics).toBeDefined();
    expect(toastSpy.showSuccess).toHaveBeenCalled();
  });

  it('saveNewCampaign is a no-op when canSave is false', () => {
    component.saveNewCampaign();
    expect(saveCampaigns).not.toHaveBeenCalled();
  });

  it('updateCampaignStatus saves and toasts', () => {
    campaignsSignal.set([{
      id: 'c1', name: 'X', influencerId: 'inf-1', influencerName: 'Maya',
      influencerHandle: '@mayachen', influencerTier: 'micro',
      platforms: ['instagram'], status: 'planning', startDate: '',
      createdAt: '', metrics: { reach: 1000 },
    }]);
    component.updateCampaignStatus('c1', 'active');
    expect(saveCampaigns).toHaveBeenCalledWith([expect.objectContaining({ status: 'active' })]);
  });

  it('engagementRate computes percentage or —', () => {
    expect(component.engagementRate(undefined)).toBe('—');
    expect(component.engagementRate({ reach: 1000, engagements: 50 })).toBe('5%');
    expect(component.engagementRate({ reach: 0 })).toBe('—');
  });

  it('setAddInfluencer with unknown handle leaves platforms unchanged', () => {
    component.toggleAddForm();
    component.updateAddField('platforms', ['instagram']);
    component.setAddInfluencer('@unknown');
    expect(component.addForm().platforms).toEqual(['instagram']);
    expect(component.addForm().influencerHandle).toBe('@unknown');
  });

  it('saveNewCampaign no-ops when selected influencer vanishes', () => {
    component.toggleAddForm();
    component.updateAddField('campaignName', 'x');
    component.updateAddField('influencerHandle', '@ghost');
    component.saveNewCampaign();
    expect(saveCampaigns).not.toHaveBeenCalled();
  });

  it('removeCampaign filters list', () => {
    campaignsSignal.set([{
      id: 'c1', name: 'X', influencerId: 'inf-1', influencerName: 'Maya',
      influencerHandle: '@mayachen', influencerTier: 'micro',
      platforms: ['instagram'], status: 'planning', startDate: '',
      createdAt: '',
    }]);
    component.removeCampaign('c1');
    expect(saveCampaigns).toHaveBeenCalledWith([]);
  });

  it('objective options include the category emoji prefix', () => {
    const [option] = component.objectiveOptions();
    expect(option.label).toBe('📈 Grow');
  });

  it('header copy matches the Figma reference', () => {
    const native: HTMLElement = fixture.nativeElement;
    expect(native.querySelector('.campaigns__title')?.textContent?.trim()).toContain('Campaigns');
    expect(native.querySelector('.campaigns__badge')?.textContent?.trim()).toBe('0');
  });

  it('empty-state copy matches the Figma reference', () => {
    const native: HTMLElement = fixture.nativeElement;
    expect(native.querySelector('.campaigns__empty-title')?.textContent?.trim()).toBe(
      'No campaigns tracked yet.',
    );
    expect(native.querySelector('.campaigns__empty-sub')?.textContent?.trim()).toBe(
      'Shortlist creators and start tracking your influencer campaigns.',
    );
  });

  it('hides the metrics block while status is planning and shows it once active', () => {
    campaignsSignal.set([{
      id: 'c1', name: 'X', influencerId: 'inf-1', influencerName: 'Maya',
      influencerHandle: '@mayachen', influencerTier: 'micro',
      platforms: ['instagram'], status: 'planning', startDate: '',
      createdAt: '', metrics: { reach: 1000 },
    }]);
    fixture.detectChanges();
    const native: HTMLElement = fixture.nativeElement;
    expect(native.querySelector('.campaigns__metrics-block')).toBeNull();

    campaignsSignal.set([{ ...campaignsSignal()[0], status: 'active' }]);
    fixture.detectChanges();
    expect(native.querySelector('.campaigns__metrics-block')).toBeTruthy();
    expect(native.querySelectorAll('.campaigns__metric-tile')).toHaveLength(5);
  });

  it('syncCampaign sets syncingId, advances timer, saves with lastSynced and toasts', () => {
    campaignsSignal.set([{
      id: 'c1', name: 'X', influencerId: 'inf-1', influencerName: 'Maya',
      influencerHandle: '@mayachen', influencerTier: 'micro',
      platforms: ['instagram'], status: 'active', startDate: '',
      createdAt: '', metrics: { reach: 1000 },
    }]);
    component.syncCampaign('c1');
    expect(component.syncingId()).toBe('c1');
    vi.advanceTimersByTime(2500);
    const saved = saveCampaigns.mock.calls[0][0][0];
    expect(saved.lastSynced).toBeTruthy();
    expect(component.syncingId()).toBeNull();
    expect(toastSpy.showSuccess).toHaveBeenCalledWith('Metrics synced');
  });

  it('viewInPerformance fires a coming-soon toast', () => {
    component.viewInPerformance();
    expect(toastSpy.showSuccess).toHaveBeenCalledWith('Performance section coming soon');
  });

  it('formatMetric returns formatted number for positive values and — otherwise', () => {
    expect(component.formatMetric(48200)).toBe('48.2K');
    expect(component.formatMetric(0)).toBe('—');
    expect(component.formatMetric(undefined)).toBe('—');
  });

  it('objectiveEmojiFor returns the category emoji or empty string', () => {
    const baseCampaign: InfluencerCampaign = {
      id: 'c1', name: 'X', influencerId: 'inf-1', influencerName: 'Maya',
      influencerHandle: '@mayachen', influencerTier: 'micro',
      platforms: ['instagram'], status: 'active', startDate: '', createdAt: '',
    };
    expect(component.objectiveEmojiFor({ ...baseCampaign, objectiveId: 'o1' })).toBe('📈');
    expect(component.objectiveEmojiFor({ ...baseCampaign, objectiveId: 'unknown' })).toBe('');
    expect(component.objectiveEmojiFor(baseCampaign)).toBe('');
  });

  it('syncCampaign is a no-op while a sync is already running for that id', () => {
    campaignsSignal.set([{
      id: 'c1', name: 'X', influencerId: 'inf-1', influencerName: 'Maya',
      influencerHandle: '@mayachen', influencerTier: 'micro',
      platforms: ['instagram'], status: 'active', startDate: '', createdAt: '',
    }]);
    component.syncCampaign('c1');
    saveCampaigns.mockClear();
    component.syncCampaign('c1');
    expect(saveCampaigns).not.toHaveBeenCalled();
  });

  it('relativeTime handles undefined, just-now, minutes, hours, and days', () => {
    expect(component.relativeTime(undefined)).toBe('');
    const now = Date.now();
    vi.setSystemTime(now);
    expect(component.relativeTime(new Date(now - 30_000).toISOString())).toBe('just now');
    expect(component.relativeTime(new Date(now - 5 * 60_000).toISOString())).toBe('5m ago');
    expect(component.relativeTime(new Date(now - 3 * 3_600_000).toISOString())).toBe('3h ago');
    expect(component.relativeTime(new Date(now - 2 * 86_400_000).toISOString())).toBe('2d ago');
    expect(component.relativeTime('not-a-date')).toBe('');
  });
});
