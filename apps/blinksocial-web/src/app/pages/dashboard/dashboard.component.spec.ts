import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { DashboardApiService } from './dashboard-api.service';

const mockWorkspacesResponse = {
  workspaces: [
    { id: 'hive-collective', name: 'Hive Collective', color: '#d94e33', status: 'active', createdAt: '2026-01-15T10:00:00Z' },
    { id: 'booze-kills', name: 'Booze Kills', color: '#2b6bff', status: 'active', createdAt: '2026-02-01T10:00:00Z' },
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

  it('should have new-workspace card as first child in grid', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const grid = el.querySelector('.workspace-grid');
    const firstChild = grid?.firstElementChild;
    expect(firstChild?.classList.contains('card-new')).toBe(true);
  });

  it('should render 2 workspace cards after API response', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const cards = el.querySelectorAll('app-workspace-card');
    expect(cards.length).toBe(2);
  });

  it('should populate workspaces signal from API', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const ws = component.workspaces();
    expect(ws[0].id).toBe('hive-collective');
    expect(ws[0].name).toBe('Hive Collective');
    expect(ws[0].color).toBe('#d94e33');
    expect(ws[1].id).toBe('booze-kills');
    expect(ws[1].name).toBe('Booze Kills');
    expect(ws[1].color).toBe('#2b6bff');
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
      'Initialize a new content strategy'
    );
  });

  it('should have a decorative background glow element', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.dashboard-bg')).toBeTruthy();
  });

  it('should call onCreateWorkspace when new card is clicked', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const spy = vi.spyOn(component, 'onCreateWorkspace');
    const el: HTMLElement = fixture.nativeElement;
    const btn = el.querySelector('.card-new') as HTMLButtonElement;
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
});
