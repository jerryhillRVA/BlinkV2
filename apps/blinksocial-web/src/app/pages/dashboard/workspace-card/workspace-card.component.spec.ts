import { TestBed } from '@angular/core/testing';
import { WorkspaceCardComponent } from './workspace-card.component';

describe('WorkspaceCardComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkspaceCardComponent],
    }).compileComponents();
  });

  function createComponent(name = 'Test Workspace', color = '#d94e33') {
    const fixture = TestBed.createComponent(WorkspaceCardComponent);
    fixture.componentInstance.workspace = { name, color };
    fixture.detectChanges();
    return fixture;
  }

  it('should create', () => {
    const fixture = createComponent();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should display workspace name in the header', () => {
    const fixture = createComponent('Hive Collective', '#d94e33');
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.header-name')?.textContent).toBe('Hive Collective');
  });

  it('should apply color to the header background', () => {
    const fixture = createComponent('Test', '#2b6bff');
    const el: HTMLElement = fixture.nativeElement;
    const header = el.querySelector('.card-header') as HTMLElement;
    expect(header.style.background).toBe('rgb(43, 107, 255)');
  });

  it('should have a globe watermark SVG', () => {
    const fixture = createComponent();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.globe-watermark')).toBeTruthy();
  });

  it('should have QUICK ACCESS label', () => {
    const fixture = createComponent();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.quick-label')?.textContent).toBe('QUICK ACCESS');
  });

  it('should have 4 quick access items in a grid', () => {
    const fixture = createComponent();
    const el: HTMLElement = fixture.nativeElement;
    const items = el.querySelectorAll('.quick-item');
    expect(items.length).toBe(4);
  });

  it('should have correct quick access labels', () => {
    const fixture = createComponent();
    const el: HTMLElement = fixture.nativeElement;
    const items = el.querySelectorAll('.quick-item');
    const labels = Array.from(items).map((item) => item.textContent?.trim());
    expect(labels).toEqual(['Content', 'Calendar', 'Performance', 'Strategy']);
  });

  it('should have SVG icons in each quick access item', () => {
    const fixture = createComponent();
    const el: HTMLElement = fixture.nativeElement;
    const items = el.querySelectorAll('.quick-item');
    items.forEach((item) => {
      expect(item.querySelector('svg')).toBeTruthy();
    });
  });

  it('should have a "Go to Workspace" link with coral color', () => {
    const fixture = createComponent('Test', '#2b6bff');
    const el: HTMLElement = fixture.nativeElement;
    const link = el.querySelector('.workspace-link') as HTMLElement;
    expect(link).toBeTruthy();
    expect(link.textContent).toContain('Go to Workspace');
    expect(link.style.color).not.toBe('rgb(43, 107, 255)');
  });

  it('should re-render when workspace input changes', () => {
    const fixture = createComponent('First', '#d94e33');
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.header-name')?.textContent).toBe('First');

    fixture.componentRef.setInput('workspace', { name: 'Second', color: '#2b6bff' });
    fixture.detectChanges();
    expect(el.querySelector('.header-name')?.textContent).toBe('Second');
  });
});
