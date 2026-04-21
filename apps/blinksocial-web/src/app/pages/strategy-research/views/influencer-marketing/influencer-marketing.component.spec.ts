import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { InfluencerMarketingComponent } from './influencer-marketing.component';
import { StrategyResearchStateService } from '../../strategy-research-state.service';
import { MockDataService } from '../../../../core/mock-data/mock-data.service';
import { ToastService } from '../../../../core/toast/toast.service';
import type {
  InfluencerCampaign,
  InfluencerProfile,
  ShortlistedInfluencer,
} from '../../strategy-research.types';

describe('InfluencerMarketingComponent', () => {
  let component: InfluencerMarketingComponent;
  let fixture: ReturnType<typeof TestBed.createComponent<InfluencerMarketingComponent>>;
  let nativeElement: HTMLElement;
  let shortlistSignal: ReturnType<typeof signal<ShortlistedInfluencer[]>>;
  let campaignsSignal: ReturnType<typeof signal<InfluencerCampaign[]>>;
  let saveShortlist: ReturnType<typeof vi.fn>;
  let isMock: ReturnType<typeof vi.fn>;

  const shortlisted: ShortlistedInfluencer = {
    id: 'inf-1', name: 'Maya Chen', handle: '@mayachen',
    platforms: ['instagram'], tier: 'micro', followers: 48200,
    engagementRate: 5.8, niche: [], audienceAlignment: 89, objectiveFit: [],
    bio: '', avatarColor: '#000', status: 'new', addedAt: '2026-01-01T00:00:00Z',
  };

  beforeEach(async () => {
    shortlistSignal = signal<ShortlistedInfluencer[]>([]);
    campaignsSignal = signal<InfluencerCampaign[]>([]);
    saveShortlist = vi.fn((data: ShortlistedInfluencer[]) => shortlistSignal.set(data));
    isMock = vi.fn().mockReturnValue(true);

    await TestBed.configureTestingModule({
      imports: [InfluencerMarketingComponent],
      providers: [
        {
          provide: StrategyResearchStateService,
          useValue: {
            shortlistedInfluencers: shortlistSignal,
            influencerCampaigns: campaignsSignal,
            dismissedInfluencers: signal<InfluencerProfile[]>([]),
            objectives: signal([]),
            pillars: signal([]),
            brandVoice: signal({ missionStatement: '', voiceAttributes: [], toneByContext: [], platformToneAdjustments: [], vocabulary: { preferred: [], avoid: [] } }),
            saveShortlist,
            saveCampaigns: vi.fn(),
            saveDismissedInfluencers: vi.fn(),
          },
        },
        { provide: MockDataService, useValue: { isMock, markReal: vi.fn(), markMock: vi.fn() } },
        { provide: ToastService, useValue: { showSuccess: vi.fn(), showError: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InfluencerMarketingComponent);
    component = fixture.componentInstance;
    nativeElement = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('creates with discovery tab active', () => {
    expect(component).toBeTruthy();
    expect(component.activeTab()).toBe('discovery');
    expect(nativeElement.querySelector('app-influencer-discovery-tab')).toBeTruthy();
  });

  it('renders 5 tabs', () => {
    expect(nativeElement.querySelectorAll('.influencer-marketing__tab')).toHaveLength(5);
  });

  it('setTab switches active tab', () => {
    component.setTab('shortlist');
    fixture.detectChanges();
    expect(component.activeTab()).toBe('shortlist');
    expect(nativeElement.querySelector('app-influencer-shortlist-tab')).toBeTruthy();
  });

  it('applies is-mock-source host class when feature is mock', () => {
    expect(component.isMockSource).toBe(true);
    expect(nativeElement.classList.contains('is-mock-source')).toBe(true);
  });

  it('omits is-mock-source when feature is real', async () => {
    isMock.mockReturnValue(false);
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [InfluencerMarketingComponent],
      providers: [
        {
          provide: StrategyResearchStateService,
          useValue: {
            shortlistedInfluencers: signal<ShortlistedInfluencer[]>([]),
            influencerCampaigns: signal<InfluencerCampaign[]>([]),
            dismissedInfluencers: signal<InfluencerProfile[]>([]),
            objectives: signal([]),
            pillars: signal([]),
            brandVoice: signal({ missionStatement: '', voiceAttributes: [], toneByContext: [], platformToneAdjustments: [], vocabulary: { preferred: [], avoid: [] } }),
            saveShortlist: vi.fn(),
            saveCampaigns: vi.fn(),
            saveDismissedInfluencers: vi.fn(),
          },
        },
        { provide: MockDataService, useValue: { isMock, markReal: vi.fn(), markMock: vi.fn() } },
        { provide: ToastService, useValue: { showSuccess: vi.fn(), showError: vi.fn() } },
      ],
    }).compileComponents();
    const f = TestBed.createComponent(InfluencerMarketingComponent);
    f.detectChanges();
    expect(f.componentInstance.isMockSource).toBe(false);
    expect((f.nativeElement as HTMLElement).classList.contains('is-mock-source')).toBe(false);
  });

  it('shortlistCount and campaignsCount reflect state', () => {
    shortlistSignal.set([shortlisted]);
    campaignsSignal.set([{
      id: 'c1', name: 'X', influencerId: 'inf-1', influencerName: 'Maya',
      influencerHandle: '@mayachen', influencerTier: 'micro',
      platforms: ['instagram'], status: 'planning', startDate: '', createdAt: '',
    }]);
    expect(component.shortlistCount()).toBe(1);
    expect(component.campaignsCount()).toBe(1);
  });

  it('onDiscoveryOutreach shortlists a new profile and switches tab', () => {
    const profile: InfluencerProfile = {
      id: 'new-1', name: 'New Creator', handle: '@newcreator',
      platforms: ['tiktok'], tier: 'nano', followers: 3000,
      engagementRate: 9, niche: [], audienceAlignment: 75, objectiveFit: [],
      bio: '', avatarColor: '#fff',
    };
    component.onDiscoveryOutreach(profile);
    expect(saveShortlist).toHaveBeenCalled();
    expect(component.activeTab()).toBe('outreach');
    expect(component.outreachInfluencer()?.handle).toBe('@newcreator');
  });

  it('onDiscoveryOutreach reuses existing shortlist entry', () => {
    shortlistSignal.set([shortlisted]);
    component.onDiscoveryOutreach(shortlisted);
    expect(saveShortlist).not.toHaveBeenCalled();
    expect(component.outreachInfluencer()?.handle).toBe('@mayachen');
  });

  it('onOpenOutreach sets influencer and activates outreach tab', () => {
    component.onOpenOutreach(shortlisted);
    expect(component.outreachInfluencer()).toEqual(shortlisted);
    expect(component.activeTab()).toBe('outreach');
  });

  it('onOpenBrief sets influencer and activates brief tab', () => {
    component.onOpenBrief(shortlisted);
    expect(component.briefInfluencer()).toEqual(shortlisted);
    expect(component.activeTab()).toBe('brief');
  });

  it('all tab badges are callable', () => {
    shortlistSignal.set([shortlisted]);
    expect(component.tabs[0].badge()).toBe(0);
    expect(component.tabs[1].badge()).toBe(1);
    expect(component.tabs[2].badge()).toBe(0);
    expect(component.tabs[3].badge()).toBe(0);
    expect(component.tabs[4].badge()).toBe(0);
  });

  it('shortlist tab shows inline count when > 0', () => {
    shortlistSignal.set([shortlisted]);
    fixture.detectChanges();
    const tabs = nativeElement.querySelectorAll('.influencer-marketing__tab');
    const shortlistTab = Array.from(tabs).find((el) => el.textContent?.includes('Shortlist'));
    expect(shortlistTab?.textContent?.replace(/\s+/g, ' ').trim()).toBe('Shortlist (1)');
  });
});
