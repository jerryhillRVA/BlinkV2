import { TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute, convertToParamMap } from '@angular/router';
import { signal } from '@angular/core';
import { of, Subject } from 'rxjs';
import type { ParamMap } from '@angular/router';
import { StrategyResearchComponent } from './strategy-research.component';
import { StrategyResearchStateService } from './strategy-research-state.service';

describe('StrategyResearchComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<StrategyResearchComponent>>;
  let component: StrategyResearchComponent;

  const mockObjectives = signal<unknown[]>([]);
  const mockStateService = {
    brandVoice: signal({
      missionStatement: '',
      voiceAttributes: [],
      toneByContext: [],
      platformToneAdjustments: [],
      vocabulary: { preferred: [] as string[], avoid: [] as string[] },
    }).asReadonly(),
    objectives: mockObjectives.asReadonly(),
    pillars: signal([]).asReadonly(),
    segments: signal([]).asReadonly(),
    channelStrategy: signal([]).asReadonly(),
    contentMix: signal([]).asReadonly(),
    researchSources: signal([]).asReadonly(),
    competitorInsights: signal([]).asReadonly(),
    audienceInsights: signal([]).asReadonly(),
    loading: signal(false).asReadonly(),
    saving: signal(false).asReadonly(),
    workspaceId: signal('test-workspace'),
    isDirty: signal(false),
    saveBrandVoice: vi.fn(),
    saveObjectives: vi.fn(),
    savePillars: vi.fn(),
    saveSegments: vi.fn(),
    saveChannelStrategy: vi.fn(),
    saveContentMix: vi.fn(),
    saveResearchSources: vi.fn(),
    saveCompetitorInsights: vi.fn(),
    saveAudienceInsights: vi.fn(),
    loadAll: vi.fn(),
  };

  beforeEach(async () => {
    mockObjectives.set([]);
    mockStateService.saveObjectives.mockClear();
    mockStateService.loadAll.mockClear();

    await TestBed.configureTestingModule({
      imports: [StrategyResearchComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ id: 'test-workspace' })),
            snapshot: { paramMap: { get: () => 'test-workspace' } },
          },
        },
        { provide: StrategyResearchStateService, useValue: mockStateService },
      ],
    })
      .overrideComponent(StrategyResearchComponent, {
        set: { providers: [] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(StrategyResearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set workspace ID from route', () => {
    expect(component.workspaceId).toBe('test-workspace');
  });

  it('should default to brand-voice view', () => {
    expect(component.activeView()).toBe('brand-voice');
  });

  it('should render sidebar navigation', () => {
    const sidebar = fixture.nativeElement.querySelector('.strategy-sidebar');
    expect(sidebar).toBeTruthy();
  });

  it('should render 4 sidebar section labels', () => {
    const labels = fixture.nativeElement.querySelectorAll('.sidebar-section-label');
    expect(labels.length).toBe(4);
    expect(labels[0].textContent).toContain('Strategy');
    expect(labels[1].textContent).toContain('Research');
    expect(labels[2].textContent).toContain('Content Tools');
    expect(labels[3].textContent).toContain('Influencer');
  });

  it('should render 12 sidebar items', () => {
    const items = fixture.nativeElement.querySelectorAll('.sidebar-item');
    expect(items.length).toBe(12);
  });

  it('should highlight active sidebar item', () => {
    const activeItem = fixture.nativeElement.querySelector('.sidebar-item.active');
    expect(activeItem).toBeTruthy();
    expect(activeItem.textContent).toContain('Brand Voice & Tone');
  });

  it('should switch active view on sidebar click', () => {
    const items = fixture.nativeElement.querySelectorAll('.sidebar-item');
    items[1].click();
    fixture.detectChanges();

    expect(component.activeView()).toBe('pillars');
    const activeItem = fixture.nativeElement.querySelector('.sidebar-item.active');
    expect(activeItem.textContent).toContain('Strategic Pillars');
  });

  it('should render objectives strip', () => {
    const strip = fixture.nativeElement.querySelector('app-objectives-strip');
    expect(strip).toBeTruthy();
  });

  it('should render content area', () => {
    const content = fixture.nativeElement.querySelector('.strategy-content');
    expect(content).toBeTruthy();
  });

  it('should render brand-voice view by default', () => {
    const brandVoice = fixture.nativeElement.querySelector('app-brand-voice');
    expect(brandVoice).toBeTruthy();
  });

  it('should switch to pillars view', () => {
    component.setActiveView('pillars');
    fixture.detectChanges();
    const pillars = fixture.nativeElement.querySelector('app-strategic-pillars');
    expect(pillars).toBeTruthy();
  });

  it('should switch to audience view', () => {
    component.setActiveView('audience');
    fixture.detectChanges();
    const audience = fixture.nativeElement.querySelector('app-audience');
    expect(audience).toBeTruthy();
  });

  it('should switch to channel view', () => {
    component.setActiveView('channel');
    fixture.detectChanges();
    const channel = fixture.nativeElement.querySelector('app-channel-strategy');
    expect(channel).toBeTruthy();
  });

  it('should switch to content-mix view', () => {
    component.setActiveView('content-mix');
    fixture.detectChanges();
    const mix = fixture.nativeElement.querySelector('app-content-mix');
    expect(mix).toBeTruthy();
  });

  it('should switch to research view', () => {
    component.setActiveView('research');
    fixture.detectChanges();
    const research = fixture.nativeElement.querySelector('app-research-sources');
    expect(research).toBeTruthy();
  });

  it('should switch to competitors view', () => {
    component.setActiveView('competitors');
    fixture.detectChanges();
    const competitors = fixture.nativeElement.querySelector('app-competitor-deep-dive');
    expect(competitors).toBeTruthy();
  });

  it('should switch to repurposer view', () => {
    component.setActiveView('repurposer');
    fixture.detectChanges();
    const repurposer = fixture.nativeElement.querySelector('app-content-repurposer');
    expect(repurposer).toBeTruthy();
  });

  it('should switch to series view', () => {
    component.setActiveView('series');
    fixture.detectChanges();
    const series = fixture.nativeElement.querySelector('app-series-builder');
    expect(series).toBeTruthy();
  });

  it('should switch to ab-analyzer view', () => {
    component.setActiveView('ab-analyzer');
    fixture.detectChanges();
    const ab = fixture.nativeElement.querySelector('app-ab-analyzer');
    expect(ab).toBeTruthy();
  });

  it('should switch to seo view', () => {
    component.setActiveView('seo');
    fixture.detectChanges();
    const seo = fixture.nativeElement.querySelector('app-seo-hashtags');
    expect(seo).toBeTruthy();
  });

  it('should update objectives via state service', () => {
    const objectives = [
      { id: 'o1', category: 'growth' as const, statement: 'Test', target: 100, unit: 'followers', timeframe: 'Q1', status: 'on-track' as const },
    ];
    component.onUpdateObjectives(objectives);
    expect(mockStateService.saveObjectives).toHaveBeenCalledWith(objectives);
  });

  it('should set workspace ID from paramMap', () => {
    expect(component.workspaceId).toBe('test-workspace');
  });

  it('should call loadAll with workspace ID from paramMap', () => {
    expect(mockStateService.loadAll).toHaveBeenCalledWith('test-workspace');
  });

  describe('paramMap branch coverage', () => {
    it('falls back to empty workspace id when paramMap returns null (no reload)', async () => {
      mockStateService.loadAll.mockClear();
      await TestBed.resetTestingModule()
        .configureTestingModule({
          imports: [StrategyResearchComponent],
          providers: [
            provideRouter([]),
            {
              provide: ActivatedRoute,
              useValue: {
                paramMap: of(convertToParamMap({})),
                snapshot: { paramMap: { get: () => null } },
              },
            },
            { provide: StrategyResearchStateService, useValue: mockStateService },
          ],
        })
        .overrideComponent(StrategyResearchComponent, {
          set: { providers: [] },
        })
        .compileComponents();
      const f = TestBed.createComponent(StrategyResearchComponent);
      f.detectChanges();
      // The ?? '' fallback resolves the missing id to ''. Since workspaceId
      // is initialised to '' as well, the inner branch is skipped — exactly
      // what we want: no spurious reload when there's no workspace in the URL.
      expect(f.componentInstance.workspaceId).toBe('');
      expect(mockStateService.loadAll).not.toHaveBeenCalled();
    });

    it('does not reload when paramMap emits the same workspace id twice', async () => {
      mockStateService.loadAll.mockClear();
      const params$ = new Subject<ParamMap>();
      await TestBed.resetTestingModule()
        .configureTestingModule({
          imports: [StrategyResearchComponent],
          providers: [
            provideRouter([]),
            {
              provide: ActivatedRoute,
              useValue: {
                paramMap: params$.asObservable(),
                snapshot: { paramMap: { get: () => 'test-workspace' } },
              },
            },
            { provide: StrategyResearchStateService, useValue: mockStateService },
          ],
        })
        .overrideComponent(StrategyResearchComponent, {
          set: { providers: [] },
        })
        .compileComponents();
      const f = TestBed.createComponent(StrategyResearchComponent);
      f.detectChanges();
      params$.next(convertToParamMap({ id: 'ws-1' }));
      params$.next(convertToParamMap({ id: 'ws-1' }));
      params$.next(convertToParamMap({ id: 'ws-2' }));
      expect(mockStateService.loadAll).toHaveBeenCalledTimes(2);
      expect(mockStateService.loadAll).toHaveBeenNthCalledWith(1, 'ws-1');
      expect(mockStateService.loadAll).toHaveBeenNthCalledWith(2, 'ws-2');
    });

    it('resets activeView to brand-voice when workspace id changes', async () => {
      const params$ = new Subject<ParamMap>();
      await TestBed.resetTestingModule()
        .configureTestingModule({
          imports: [StrategyResearchComponent],
          providers: [
            provideRouter([]),
            {
              provide: ActivatedRoute,
              useValue: {
                paramMap: params$.asObservable(),
                snapshot: { paramMap: { get: () => 'ws-a' } },
              },
            },
            { provide: StrategyResearchStateService, useValue: mockStateService },
          ],
        })
        .overrideComponent(StrategyResearchComponent, {
          set: { providers: [] },
        })
        .compileComponents();
      const f = TestBed.createComponent(StrategyResearchComponent);
      f.detectChanges();
      params$.next(convertToParamMap({ id: 'ws-a' }));
      f.componentInstance.setActiveView('pillars');
      expect(f.componentInstance.activeView()).toBe('pillars');
      params$.next(convertToParamMap({ id: 'ws-b' }));
      expect(f.componentInstance.activeView()).toBe('brand-voice');
    });
  });
});
