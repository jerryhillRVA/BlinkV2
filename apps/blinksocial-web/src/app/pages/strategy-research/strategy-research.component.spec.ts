import { TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { StrategyResearchComponent } from './strategy-research.component';

describe('StrategyResearchComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<StrategyResearchComponent>>;
  let component: StrategyResearchComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StrategyResearchComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: () => 'test-workspace' } },
          },
        },
      ],
    }).compileComponents();

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

  it('should render 3 sidebar section labels', () => {
    const labels = fixture.nativeElement.querySelectorAll('.sidebar-section-label');
    expect(labels.length).toBe(3);
    expect(labels[0].textContent).toContain('Strategy');
    expect(labels[1].textContent).toContain('Research');
    expect(labels[2].textContent).toContain('Content Tools');
  });

  it('should render 11 sidebar items', () => {
    const items = fixture.nativeElement.querySelectorAll('.sidebar-item');
    expect(items.length).toBe(11);
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

  it('should update objectives', () => {
    const objectives = [
      { id: 'o1', category: 'growth' as const, statement: 'Test', target: 100, unit: 'followers', timeframe: 'Q1', status: 'on-track' as const },
    ];
    component.onUpdateObjectives(objectives);
    expect(component.objectives()).toEqual(objectives);
  });
});
