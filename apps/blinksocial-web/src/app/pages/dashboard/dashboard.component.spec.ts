import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { DashboardApiService } from './dashboard-api.service';

const mockWorkspacesResponse = {
  workspaces: [
    { id: 'hive-collective', name: 'Hive Collective', color: '#d94e33', status: 'active', createdAt: '2026-01-15T10:00:00Z' },
    { id: 'booze-kills', name: 'Booze Kills', color: '#2b6bff', status: 'active', createdAt: '2026-02-01T10:00:00Z' },
    { id: 'onboard-ws', name: 'Onboarding WS', color: '#10b981', status: 'onboarding', createdAt: '2026-03-01T10:00:00Z' },
    { id: 'creating-ws', name: 'Creating WS', color: '#f59e0b', status: 'creating', createdAt: '2026-03-15T10:00:00Z' },
    { id: 'no-status-ws', name: 'No Status WS', color: '#888', createdAt: '2026-03-20T10:00:00Z' },
  ],
};

describe('DashboardComponent', () => {
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: DashboardApiService, useValue: { listWorkspaces: () => of(mockWorkspacesResponse) } },
      ],
    }).compileComponents();
    router = TestBed.inject(Router);
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should have a header icon with SVG', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const icon = el.querySelector('.header-icon');
    expect(icon).toBeTruthy();
    expect(icon?.querySelector('svg')).toBeTruthy();
  });

  it('should display "Welcome to Blink Social" heading', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('h1')?.textContent).toBe('Welcome to Blink Social');
  });

  it('should display the subtitle', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.subtitle')?.textContent?.trim()).toContain(
      'multi-platform content strategy'
    );
  });

  it('should have combined new-workspace card as first child in grid', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const grid = el.querySelector('.workspace-grid');
    const firstChild = grid?.firstElementChild;
    expect(firstChild?.classList.contains('card-new-combined')).toBe(true);
  });

  it('should render 3 active workspace cards after API response (including no-status workspace)', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const cards = el.querySelectorAll('app-workspace-card');
    expect(cards.length).toBe(3);
  });

  it('should render 2 in-progress cards after API response', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const cards = el.querySelectorAll('app-in-progress-card');
    expect(cards.length).toBe(2);
  });

  it('should show in-progress section when in-progress workspaces exist', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const section = el.querySelector('.in-progress-section');
    expect(section).toBeTruthy();
    expect(el.querySelector('.section-title')?.textContent).toContain('In Progress');
  });

  it('should populate workspaces signal from API with status', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const ws = component.workspaces();
    expect(ws[0].id).toBe('hive-collective');
    expect(ws[0].name).toBe('Hive Collective');
    expect(ws[0].color).toBe('#d94e33');
    expect(ws[0].status).toBe('active');
    expect(ws[1].id).toBe('booze-kills');
    expect(ws[1].name).toBe('Booze Kills');
    expect(ws[1].color).toBe('#2b6bff');
  });

  it('should split workspaces into active and in-progress', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(component.activeWorkspaces().length).toBe(3);
    expect(component.inProgressWorkspaces().length).toBe(2);
  });

  it('should set loading to false after API response', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.loading()).toBe(false);
  });

  it('should have a plus-circle wrapper', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.plus-circle')).toBeTruthy();
  });

  it('should have new workspace description text', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.new-description')?.textContent).toContain(
      'Set up a new content strategy'
    );
  });

  it('should have a decorative background glow element', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.dashboard-bg')).toBeTruthy();
  });

  it('should call onCreateWorkspace when wizard action button is clicked', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const spy = vi.spyOn(component, 'onCreateWorkspace');
    const el: HTMLElement = fixture.nativeElement;
    const btn = el.querySelector('.action-wizard') as HTMLButtonElement;
    btn.click();
    expect(spy).toHaveBeenCalled();
  });

  it('should navigate to /new-workspace when onCreateWorkspace is called', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.componentInstance.onCreateWorkspace();
    expect(router.navigate).toHaveBeenCalledWith(['/new-workspace']);
  });

  it('should navigate to workspace settings when onGoToWorkspace is called', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.componentInstance.onGoToWorkspace('hive-collective');
    expect(router.navigate).toHaveBeenCalledWith(['/workspace', 'hive-collective', 'settings']);
  });

  it('should navigate to workspace content when onGoToContent is called', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.componentInstance.onGoToContent('hive-collective');
    expect(router.navigate).toHaveBeenCalledWith(['/workspace', 'hive-collective', 'content']);
  });

  it('should navigate to workspace calendar when onGoToCalendar is called', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.componentInstance.onGoToCalendar('hive-collective');
    expect(router.navigate).toHaveBeenCalledWith(['/workspace', 'hive-collective', 'calendar']);
  });

  it('should set loading to false on API error', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: DashboardApiService, useValue: { listWorkspaces: () => throwError(() => new Error('fail')) } },
      ],
    });
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.loading()).toBe(false);
    expect(fixture.componentInstance.workspaces()).toEqual([]);
  });
});
