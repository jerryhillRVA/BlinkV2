import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConceptOptionsPanelComponent } from './concept-options-panel.component';
import { IdeaDetailStore } from '../idea-detail.store';
import { ContentStateService } from '../../../content-state.service';
import { provideContentItemsApiStubs } from '../../../content-items-api.test-util';
import { AI_SIMULATION_DELAY_MS } from '../../../content.constants';
import type {
  AudienceSegment,
  ContentItem,
  ContentPillar,
} from '../../../content.types';

const PILLARS: ContentPillar[] = [
  { id: 'p1', name: 'P1', description: '', color: '#111' },
  { id: 'p2', name: 'P2', description: '', color: '#222' },
];
const SEGMENTS: AudienceSegment[] = [
  { id: 's1', name: 'S1', description: '' },
];

function makeItem(): ContentItem {
  const now = new Date().toISOString();
  return {
    id: 'c-1',
    stage: 'idea',
    status: 'draft',
    title: 'T',
    description: '',
    pillarIds: [],
    segmentIds: [],
    createdAt: now,
    updatedAt: now,
  };
}

function setup(): {
  fixture: ComponentFixture<ConceptOptionsPanelComponent>;
  store: IdeaDetailStore;
} {
  TestBed.configureTestingModule({
    imports: [ConceptOptionsPanelComponent],
    providers: [...provideContentItemsApiStubs(), ContentStateService, IdeaDetailStore],
  });
  const state = TestBed.inject(ContentStateService);
  state.setItems([makeItem()]);
  state.pillars.set(PILLARS);
  state.segments.set(SEGMENTS);
  const store = TestBed.inject(IdeaDetailStore);
  store.setItemId('c-1');
  const fixture = TestBed.createComponent(ConceptOptionsPanelComponent);
  fixture.detectChanges();
  return { fixture, store };
}

describe('ConceptOptionsPanelComponent', () => {
  it('renders the Generate empty state by default', () => {
    const { fixture } = setup();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('.btn-generate');
    expect(btn).not.toBeNull();
    expect(btn.textContent).toContain('Generate Concept Options');
  });

  it('clicking Generate transitions to loading state with skeleton grid', () => {
    vi.useFakeTimers();
    try {
      const { fixture } = setup();
      const btn: HTMLButtonElement = fixture.nativeElement.querySelector('.btn-generate');
      btn.click();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelectorAll('.options-skeleton').length).toBe(6);
      expect(fixture.nativeElement.querySelector('.options-loading-label')).not.toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('skeleton shares the .option-card shell class with real cards (matching size)', () => {
    vi.useFakeTimers();
    try {
      const { fixture } = setup();
      (fixture.nativeElement.querySelector('.btn-generate') as HTMLButtonElement).click();
      fixture.detectChanges();
      const skeletons = fixture.nativeElement.querySelectorAll('.options-skeleton') as NodeListOf<HTMLElement>;
      skeletons.forEach((el) => {
        expect(el.classList.contains('option-card')).toBe(true);
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it('skeleton renders placeholder blocks mirroring the real-card sections (title, description, meta, cta)', () => {
    vi.useFakeTimers();
    try {
      const { fixture } = setup();
      (fixture.nativeElement.querySelector('.btn-generate') as HTMLButtonElement).click();
      fixture.detectChanges();
      const first = fixture.nativeElement.querySelector('.options-skeleton') as HTMLElement;
      expect(first.querySelector('.skeleton-check')).toBeNull();
      expect(first.querySelector('.skeleton-line--title')).not.toBeNull();
      expect(first.querySelectorAll('.skeleton-line--description').length).toBeGreaterThanOrEqual(2);
      expect(first.querySelectorAll('.skeleton-meta-row').length).toBeGreaterThanOrEqual(2);
      expect(first.querySelector('.skeleton-line--cta')).not.toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('after AI resolves, renders 6 ConceptOptionCard components and a Regenerate button', () => {
    vi.useFakeTimers();
    try {
      const { fixture } = setup();
      (fixture.nativeElement.querySelector('.btn-generate') as HTMLButtonElement).click();
      fixture.detectChanges();
      vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelectorAll('app-concept-option-card').length).toBe(6);
      expect(fixture.nativeElement.querySelector('.options-panel-regenerate')).not.toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('clicking Regenerate resets the grid and re-triggers the AI', () => {
    vi.useFakeTimers();
    try {
      const { fixture } = setup();
      (fixture.nativeElement.querySelector('.btn-generate') as HTMLButtonElement).click();
      vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
      fixture.detectChanges();
      const regenerate: HTMLButtonElement = fixture.nativeElement.querySelector('.options-panel-regenerate');
      regenerate.click();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelectorAll('.options-skeleton').length).toBe(6);
      vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelectorAll('app-concept-option-card').length).toBe(6);
    } finally {
      vi.useRealTimers();
    }
  });

  it('clicking a rendered option card toggles selection via the store', () => {
    vi.useFakeTimers();
    try {
      const { fixture, store } = setup();
      (fixture.nativeElement.querySelector('.btn-generate') as HTMLButtonElement).click();
      vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
      fixture.detectChanges();
      const firstCard: HTMLButtonElement = fixture.nativeElement.querySelector(
        'app-concept-option-card .option-card',
      );
      firstCard.click();
      fixture.detectChanges();
      expect(store.selectedOptionId()).not.toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});
