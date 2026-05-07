import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ContentCreateDrawerComponent } from './content-create-drawer.component';
import type {
  AudienceSegment,
  ContentPillar,
  IdeaPayload,
} from '../../../content.types';

const PILLARS: ContentPillar[] = [
  { id: 'p1', name: 'Alpha', description: '', color: '#111' },
];
const SEGMENTS: AudienceSegment[] = [
  { id: 's1', name: 'S1', description: '' },
];

function make(): ComponentFixture<ContentCreateDrawerComponent> {
  TestBed.configureTestingModule({ imports: [ContentCreateDrawerComponent] });
  const fixture = TestBed.createComponent(ContentCreateDrawerComponent);
  fixture.componentRef.setInput('pillars', PILLARS);
  fixture.componentRef.setInput('segments', SEGMENTS);
  fixture.detectChanges();
  return fixture;
}

describe('ContentCreateDrawerComponent', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    document.body.style.overflow = '';
  });

  it('teleports the drawer into document.body', () => {
    const fixture = make();
    expect(
      document.body.querySelector('[data-testid="content-create-drawer"]'),
    ).not.toBeNull();
    fixture.destroy();
  });

  it('sets body overflow hidden while mounted, restores on destroy', () => {
    const fixture = make();
    expect(document.body.style.overflow).toBe('hidden');
    fixture.destroy();
    expect(document.body.style.overflow).toBe('');
  });

  it('renders no backdrop / modal-overlay element', () => {
    const fixture = make();
    expect(
      document.body.querySelector('.modal-overlay, .drawer-backdrop'),
    ).toBeNull();
    fixture.destroy();
  });

  it('renders the inner ContentCreateFormComponent and forwards initialType', () => {
    TestBed.configureTestingModule({
      imports: [ContentCreateDrawerComponent],
    });
    const fixture = TestBed.createComponent(ContentCreateDrawerComponent);
    fixture.componentRef.setInput('pillars', PILLARS);
    fixture.componentRef.setInput('segments', SEGMENTS);
    fixture.componentRef.setInput('initialType', 'concept');
    fixture.detectChanges();

    const form = document.body.querySelector('app-content-create-form');
    expect(form).not.toBeNull();
    // Type dropdown reflects the initial type.
    const dropdownLabel = document.body.querySelector('app-dropdown');
    expect(dropdownLabel?.textContent).toContain('Concept');
    fixture.destroy();
  });

  it('emits cancel on close (X) button click', () => {
    const fixture = make();
    let cancelled = 0;
    fixture.componentInstance.cancelCreate.subscribe(() => cancelled++);
    const btn = document.body.querySelector('.drawer-close') as HTMLButtonElement;
    btn.click();
    expect(cancelled).toBe(1);
    fixture.destroy();
  });

  it('Escape key fires cancelCreate via onEscape handler', () => {
    const fixture = make();
    let cancelled = 0;
    fixture.componentInstance.cancelCreate.subscribe(() => cancelled++);
    (fixture.componentInstance as unknown as { onEscape: () => void }).onEscape();
    expect(cancelled).toBe(1);
    fixture.destroy();
  });

  it('forwards saveMany event from inner form', () => {
    const fixture = make();
    const emitted: IdeaPayload[][] = [];
    fixture.componentInstance.saveMany.subscribe((v) => emitted.push(v));
    fixture.componentInstance.saveMany.emit([
      {
        kind: 'idea',
        title: 'X',
        description: '',
        pillarIds: [],
        segmentIds: [],
      },
    ]);
    expect(emitted).toHaveLength(1);
    fixture.destroy();
  });

  it('adds the .open class on the next animation frame', async () => {
    const fixture = make();
    const drawer = document.body.querySelector(
      '[data-testid="content-create-drawer"]',
    ) as HTMLElement;
    expect(drawer.classList.contains('open')).toBe(false);
    // Wait for the rAF the component schedules in ngAfterViewInit.
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
    expect(drawer.classList.contains('open')).toBe(true);
    fixture.destroy();
  });

  it('focuses the first focusable element inside the drawer after open', async () => {
    const fixture = make();
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
    const drawer = document.body.querySelector(
      '[data-testid="content-create-drawer"]',
    ) as HTMLElement;
    expect(drawer.contains(document.activeElement)).toBe(true);
    fixture.destroy();
  });

  it('restores focus to the previously focused element on destroy', async () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    const fixture = make();
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
    fixture.destroy();
    expect(document.activeElement).toBe(trigger);
  });
});
