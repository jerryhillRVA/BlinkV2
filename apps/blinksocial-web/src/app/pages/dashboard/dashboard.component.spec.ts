import { TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
    }).compileComponents();
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

  it('should render 2 workspace cards', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const cards = el.querySelectorAll('app-workspace-card');
    expect(cards.length).toBe(2);
  });

  it('should have correct workspace data', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;
    expect(component.workspaces[0].name).toBe('Hive Collective');
    expect(component.workspaces[0].color).toBe('#d94e33');
    expect(component.workspaces[1].name).toBe('Booze Kills');
    expect(component.workspaces[1].color).toBe('#2b6bff');
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
});
