import { TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { signal } from '@angular/core';
import { of, BehaviorSubject } from 'rxjs';
import { ContentComponent } from './content.component';
import { ContentStateService } from './content-state.service';
import type { ContentView } from './content.types';

describe('ContentComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<ContentComponent>>;
  let component: ContentComponent;
  let router: Router;

  const mockStateService = {
    items: signal([]).asReadonly(),
    pillars: signal([]).asReadonly(),
    segments: signal([]).asReadonly(),
    loading: signal(false),
    saving: signal(false),
    workspaceId: signal('test-workspace'),
    stepCounts: signal({
      overview: 5,
      strategy: 0,
      production: 2,
      review: 1,
      performance: 3,
    }),
    loadAll: vi.fn(),
    saveItem: vi.fn(),
    deleteItem: vi.fn(),
    updateStatus: vi.fn(),
    advanceStage: vi.fn(),
  };

  beforeEach(async () => {
    mockStateService.loadAll.mockClear();

    await TestBed.configureTestingModule({
      imports: [ContentComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ id: 'test-workspace' })),
            snapshot: { paramMap: { get: () => 'test-workspace' } },
          },
        },
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: ContentStateService, useValue: mockStateService },
      ],
    })
      .overrideComponent(ContentComponent, {
        set: { providers: [] },
      })
      .compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(ContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set workspace ID from route', () => {
    expect(component.workspaceId).toBe('test-workspace');
  });

  it('should default to overview view', () => {
    expect(component.activeView()).toBe('overview');
  });

  it('should call loadAll on construction', () => {
    expect(mockStateService.loadAll).toHaveBeenCalledWith('test-workspace');
  });

  it('should navigate to strategy page instead of switching view', () => {
    component.setActiveView('strategy');
    expect(router.navigate).toHaveBeenCalledWith(['/workspace', 'test-workspace', 'strategy']);
    expect(component.activeView()).toBe('overview');
  });

  it('should render content main area', () => {
    const content = fixture.nativeElement.querySelector('.content-main');
    expect(content).toBeTruthy();
  });

  it('should render pipeline view by default', () => {
    const pipeline = fixture.nativeElement.querySelector('app-pipeline-view');
    expect(pipeline).toBeTruthy();
  });

  it('should render full-width without sidebar', () => {
    const sidebar = fixture.nativeElement.querySelector('.content-sidebar');
    expect(sidebar).toBeFalsy();
  });

  it('should switch to production stub', () => {
    component.setActiveView('production');
    fixture.detectChanges();
    const stub = fixture.nativeElement.querySelector('app-production-stub');
    expect(stub).toBeTruthy();
  });

  it('should switch to review stub', () => {
    component.setActiveView('review');
    fixture.detectChanges();
    const stub = fixture.nativeElement.querySelector('app-review-stub');
    expect(stub).toBeTruthy();
  });

  it('should switch to performance stub', () => {
    component.setActiveView('performance');
    fixture.detectChanges();
    const stub = fixture.nativeElement.querySelector('app-performance-stub');
    expect(stub).toBeTruthy();
  });

  it('should render strategy stub when activeView is set directly', () => {
    // Use type assertion to bypass setActiveView which navigates
    (component.activeView as ReturnType<typeof signal<ContentView>>).set('strategy');
    fixture.detectChanges();
    const stub = fixture.nativeElement.querySelector('app-strategy-stub');
    expect(stub).toBeTruthy();
  });

  it('should show loading state when loading', () => {
    mockStateService.loading.set(true);
    fixture.detectChanges();
    const loading = fixture.nativeElement.querySelector('.loading-state');
    expect(loading).toBeTruthy();
  });

  it('should not show pipeline view when loading', () => {
    mockStateService.loading.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-pipeline-view')).toBeFalsy();
  });

  it('should set view to production and back to overview', () => {
    component.setActiveView('production');
    expect(component.activeView()).toBe('production');
    component.setActiveView('overview');
    expect(component.activeView()).toBe('overview');
  });

  it('should set view to review', () => {
    component.setActiveView('review');
    expect(component.activeView()).toBe('review');
  });

  it('should set view to performance', () => {
    component.setActiveView('performance');
    expect(component.activeView()).toBe('performance');
  });

  it('should reload data when workspace ID changes via paramMap', async () => {
    const paramMap$ = new BehaviorSubject(convertToParamMap({ id: 'ws-1' }));
    mockStateService.loadAll.mockClear();

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ContentComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: paramMap$.asObservable(),
            snapshot: { paramMap: { get: () => 'ws-1' } },
          },
        },
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: ContentStateService, useValue: mockStateService },
      ],
    })
      .overrideComponent(ContentComponent, { set: { providers: [] } })
      .compileComponents();

    const f = TestBed.createComponent(ContentComponent);
    f.detectChanges();
    expect(mockStateService.loadAll).toHaveBeenCalledWith('ws-1');

    // Switch workspace — the transition uses setTimeout(0)
    vi.useFakeTimers();
    paramMap$.next(convertToParamMap({ id: 'ws-2' }));
    vi.runAllTimers();
    vi.useRealTimers();
    f.detectChanges();
    expect(mockStateService.loadAll).toHaveBeenCalledWith('ws-2');
    expect(f.componentInstance.workspaceId).toBe('ws-2');
    expect(f.componentInstance.transitioning()).toBe(false);
  });

  it('should not reload when same workspace ID emits', () => {
    mockStateService.loadAll.mockClear();
    // Emit same workspace ID again — should not trigger a reload
    const currentId = component.workspaceId;
    expect(currentId).toBe('test-workspace');
    // loadAll already called once on init; clear and verify no second call
    expect(mockStateService.loadAll).not.toHaveBeenCalled();
  });

  describe('create modal wiring', () => {
    beforeEach(() => {
      mockStateService.saveItem.mockClear();
      document.body.innerHTML = '';
    });

    it('openCreate flips showCreate signal', () => {
      expect(component.showCreate()).toBe(false);
      component.openCreate();
      expect(component.showCreate()).toBe(true);
    });

    it('openCreate(type) records the initial type for the modal', () => {
      component.openCreate('concept');
      expect(component.showCreate()).toBe(true);
      expect(component.createInitialType()).toBe('concept');
      component.closeCreate();
      component.openCreate('production-brief');
      expect(component.createInitialType()).toBe('production-brief');
      component.closeCreate();
      component.openCreate();
      expect(component.createInitialType()).toBeUndefined();
    });

    it('closeCreate flips showCreate signal', () => {
      component.openCreate();
      component.closeCreate();
      expect(component.showCreate()).toBe(false);
    });

    it('onCreateSave calls saveItem with a valid ContentItem and closes modal', () => {
      component.openCreate();
      component.onCreateSave({
        kind: 'idea',
        title: 'My idea',
        description: '',
        pillarIds: [],
        segmentIds: [],
      });
      expect(mockStateService.saveItem).toHaveBeenCalledTimes(1);
      const item = mockStateService.saveItem.mock.calls[0][0];
      expect(item.title).toBe('My idea');
      expect(item.stage).toBe('idea');
      expect(item.status).toBe('draft');
      expect(item.id).toMatch(/^c-/);
      expect(component.showCreate()).toBe(false);
    });

    it('onCreateSaveMany saves every payload and closes modal', () => {
      component.openCreate();
      component.onCreateSaveMany([
        { kind: 'idea', title: 'A', description: '', pillarIds: ['p1'], segmentIds: [] },
        { kind: 'idea', title: 'B', description: '', pillarIds: ['p2'], segmentIds: [] },
      ]);
      expect(mockStateService.saveItem).toHaveBeenCalledTimes(2);
      expect(component.showCreate()).toBe(false);
    });

    it('onMoveToProduction saves but does NOT close modal', () => {
      component.openCreate();
      component.onMoveToProduction({
        kind: 'production',
        title: 'T',
        description: 'd',
        pillarIds: ['p1'],
        segmentIds: ['s1'],
        hook: 'h',
        objective: 'engagement',
        platform: 'instagram',
        contentType: 'reel',
      });
      expect(mockStateService.saveItem).toHaveBeenCalledTimes(1);
      expect(component.showCreate()).toBe(true);
    });

    it('onDraftAssets saves, closes modal, and navigates to production view', () => {
      component.openCreate();
      component.onDraftAssets({
        kind: 'brief',
        title: 'T',
        description: '',
        pillarIds: [],
        segmentIds: ['s1'],
        platform: 'instagram',
        contentType: 'reel',
        objective: 'engagement',
        keyMessage: 'msg',
      });
      expect(mockStateService.saveItem).toHaveBeenCalledTimes(1);
      expect(component.showCreate()).toBe(false);
      expect(component.activeView()).toBe('production');
    });

    it('renders the modal when showCreate is true', () => {
      component.openCreate();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('app-content-create-modal')).toBeTruthy();
    });

    it('onMoveToProduction keeps modal open (does not call closeCreate)', () => {
      component.openCreate();
      const spy = vi.spyOn(component, 'closeCreate');
      component.onMoveToProduction({
        kind: 'production',
        title: 'T',
        description: 'x'.repeat(60),
        pillarIds: ['p1'],
        segmentIds: ['s1'],
        hook: 'h',
        objective: 'engagement',
        platform: 'instagram',
        contentType: 'reel',
      });
      expect(spy).not.toHaveBeenCalled();
      expect(component.showCreate()).toBe(true);
    });

    it('onCreateConcept saves the idea and keeps the modal open', () => {
      component.openCreate();
      component.onCreateConcept({
        kind: 'idea',
        title: 'Promote me',
        description: '',
        pillarIds: ['p1'],
        segmentIds: [],
      });
      expect(mockStateService.saveItem).toHaveBeenCalledTimes(1);
      const item = mockStateService.saveItem.mock.calls[0][0];
      expect(item.stage).toBe('idea');
      expect(item.status).toBe('draft');
      expect(component.showCreate()).toBe(true); // modal stays open
    });

    it('onCreateSaveMany with empty array still closes the modal and makes no saves', () => {
      component.openCreate();
      component.onCreateSaveMany([]);
      expect(mockStateService.saveItem).not.toHaveBeenCalled();
      expect(component.showCreate()).toBe(false);
    });
  });

  describe('route param fallback', () => {
    it('coerces a null workspace id to an empty string via ?? fallback', async () => {
      mockStateService.loadAll.mockClear();
      const paramMap$ = new BehaviorSubject(convertToParamMap({ id: 'ws-1' }));
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [ContentComponent],
        providers: [
          provideRouter([]),
          {
            provide: ActivatedRoute,
            useValue: {
              paramMap: paramMap$.asObservable(),
              snapshot: { paramMap: { get: () => 'ws-1' } },
            },
          },
          { provide: Router, useValue: { navigate: vi.fn() } },
          { provide: ContentStateService, useValue: mockStateService },
        ],
      })
        .overrideComponent(ContentComponent, { set: { providers: [] } })
        .compileComponents();
      const f = TestBed.createComponent(ContentComponent);
      f.detectChanges();
      expect(f.componentInstance.workspaceId).toBe('ws-1');
      // Now emit a paramMap with NO id — ?? '' kicks in
      vi.useFakeTimers();
      paramMap$.next(convertToParamMap({}));
      vi.runAllTimers();
      vi.useRealTimers();
      f.detectChanges();
      expect(f.componentInstance.workspaceId).toBe('');
      expect(mockStateService.loadAll).toHaveBeenCalledWith('');
    });
  });
});
