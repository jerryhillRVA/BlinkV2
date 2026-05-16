import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ContentCreateDrawerComponent } from './content-create-drawer.component';
import { GeneratedIdeasApiService } from '../../../../../core/generated-ideas/generated-ideas.service';
import { ToastService } from '../../../../../core/toast/toast.service';
import type {
  AudienceSegment,
  ContentPillar,
  IdeaPayload,
} from '../../../content.types';

const STORE_DEPS = [
  {
    provide: GeneratedIdeasApiService,
    useValue: { generate: vi.fn().mockReturnValue(of({ ideas: [] })) },
  },
  {
    provide: ToastService,
    useValue: { showError: vi.fn(), showSuccess: vi.fn() },
  },
];

const PILLARS: ContentPillar[] = [
  { id: 'p1', name: 'Alpha', description: '', color: '#111' },
];
const SEGMENTS: AudienceSegment[] = [
  { id: 's1', name: 'S1', description: '' },
];

function make(): ComponentFixture<ContentCreateDrawerComponent> {
  TestBed.configureTestingModule({
    imports: [ContentCreateDrawerComponent],
    providers: STORE_DEPS,
  });
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

  it('renders a backdrop alongside the drawer in document.body', () => {
    const fixture = make();
    const backdrop = document.body.querySelector(
      '[data-testid="content-create-drawer-backdrop"]',
    );
    expect(backdrop).not.toBeNull();
    // The backdrop must be a sibling at the body level, not nested inside
    // the drawer (so its z-index sits between the page and the drawer).
    expect(backdrop?.parentElement).toBe(document.body);
    fixture.destroy();
  });

  it('marks the backdrop aria-hidden so it is invisible to assistive tech', () => {
    const fixture = make();
    const backdrop = document.body.querySelector(
      '[data-testid="content-create-drawer-backdrop"]',
    );
    expect(backdrop?.getAttribute('aria-hidden')).toBe('true');
    fixture.destroy();
  });

  it('emits cancelCreate when the backdrop is clicked', () => {
    const fixture = make();
    let cancelled = 0;
    fixture.componentInstance.cancelCreate.subscribe(() => cancelled++);
    const backdrop = document.body.querySelector(
      '[data-testid="content-create-drawer-backdrop"]',
    ) as HTMLElement;
    backdrop.click();
    expect(cancelled).toBe(1);
    fixture.destroy();
  });

  it('adds the .open class to the backdrop on the next animation frame', async () => {
    const fixture = make();
    const backdrop = document.body.querySelector(
      '[data-testid="content-create-drawer-backdrop"]',
    ) as HTMLElement;
    expect(backdrop.classList.contains('open')).toBe(false);
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
    expect(backdrop.classList.contains('open')).toBe(true);
    fixture.destroy();
  });

  it('renders square top corners (no border-radius) so the drawer sits flush against the header', () => {
    const fixture = make();
    const drawer = document.body.querySelector(
      '[data-testid="content-create-drawer"]',
    ) as HTMLElement;
    const styles = getComputedStyle(drawer);
    expect(parseFloat(styles.borderTopLeftRadius)).toBe(0);
    expect(parseFloat(styles.borderTopRightRadius)).toBe(0);
    fixture.destroy();
  });

  it('insets the drawer content with at least 2rem of horizontal padding', () => {
    const fixture = make();
    const drawer = document.body.querySelector(
      '[data-testid="content-create-drawer"]',
    ) as HTMLElement;
    // jsdom's default root font-size is 16px, so 2rem === 32px.
    expect(parseFloat(getComputedStyle(drawer).paddingLeft)).toBeGreaterThanOrEqual(32);
    expect(parseFloat(getComputedStyle(drawer).paddingRight)).toBeGreaterThanOrEqual(32);
    fixture.destroy();
  });

  it('caps the form content at 1280px max-width and centers it horizontally', () => {
    const fixture = make();
    const form = document.body.querySelector(
      'app-content-create-form',
    ) as HTMLElement;
    const styles = getComputedStyle(form);
    expect(styles.maxWidth).toBe('1280px');
    expect(styles.marginLeft).toBe('auto');
    expect(styles.marginRight).toBe('auto');
    fixture.destroy();
  });

  it('renders the shared dashboard-bg image inside the drawer (decorative)', () => {
    const fixture = make();
    const drawer = document.body.querySelector(
      '[data-testid="content-create-drawer"]',
    ) as HTMLElement;
    const img = drawer.querySelector('img[src*="dashboard-bg"]');
    expect(img).not.toBeNull();
    // Decorative: must not be announced by assistive tech.
    const wrapper = img?.closest('[aria-hidden="true"]');
    expect(wrapper).not.toBeNull();
    fixture.destroy();
  });

  it('positions the backdrop below the 64px app header (does not cover it)', () => {
    const fixture = make();
    const backdrop = document.body.querySelector(
      '[data-testid="content-create-drawer-backdrop"]',
    ) as HTMLElement;
    expect(getComputedStyle(backdrop).top).toBe('64px');
    fixture.destroy();
  });

  it('removes the backdrop from the DOM when destroyed', () => {
    const fixture = make();
    expect(
      document.body.querySelector(
        '[data-testid="content-create-drawer-backdrop"]',
      ),
    ).not.toBeNull();
    fixture.destroy();
    expect(
      document.body.querySelector(
        '[data-testid="content-create-drawer-backdrop"]',
      ),
    ).toBeNull();
  });

  it('renders the inner ContentCreateFormComponent and forwards initialType', () => {
    TestBed.configureTestingModule({
      imports: [ContentCreateDrawerComponent],
      providers: STORE_DEPS,
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
