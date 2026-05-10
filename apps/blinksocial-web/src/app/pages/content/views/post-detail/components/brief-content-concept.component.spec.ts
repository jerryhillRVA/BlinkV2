import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BriefContentConceptComponent } from './brief-content-concept.component';
import type {
  AudienceSegment,
  ContentItem,
  ContentPillar,
} from '../../../content.types';
import type { BusinessObjectiveContract } from '@blinksocial/contracts';

const PILLARS: ContentPillar[] = [
  { id: 'p1', name: 'Wellness', description: '', color: '#d94e33' },
  { id: 'p2', name: 'Mindfulness', description: '', color: '#3b82f6' },
];

const SEGMENTS: AudienceSegment[] = [
  { id: 's1', name: 'New Moms', description: '' },
  { id: 's2', name: 'Stressed Pros', description: '' },
];

const OBJECTIVES: BusinessObjectiveContract[] = [
  { id: 'obj-1', category: 'awareness', statement: 'Q3 awareness lift', target: 1, unit: '', timeframe: '' },
];

function makeConcept(partial: Partial<ContentItem> = {}): ContentItem {
  const now = new Date().toISOString();
  return {
    id: 'c-1',
    stage: 'concept',
    status: 'draft',
    title: 'A concept',
    description: 'A 90-second reel walking through three breath techniques.',
    pillarIds: ['p1'],
    segmentIds: ['s1'],
    hook: 'Stop scrolling — your nervous system needs this.',
    objective: 'engagement',
    objectiveId: 'obj-1',
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

function setup(
  concept: ContentItem | null,
): ComponentFixture<BriefContentConceptComponent> {
  TestBed.configureTestingModule({ imports: [BriefContentConceptComponent] });
  const fixture = TestBed.createComponent(BriefContentConceptComponent);
  fixture.componentRef.setInput('concept', concept);
  fixture.componentRef.setInput('pillars', PILLARS);
  fixture.componentRef.setInput('segments', SEGMENTS);
  fixture.componentRef.setInput('objectives', OBJECTIVES);
  fixture.detectChanges();
  return fixture;
}

describe('BriefContentConceptComponent', () => {
  it('renders nothing when concept is null', () => {
    const fixture = setup(null);
    expect(fixture.nativeElement.querySelector('.brief-content-concept-card')).toBeNull();
  });

  it('renders the Edit Concept link in the header', () => {
    const fixture = setup(makeConcept());
    expect(
      (fixture.nativeElement.querySelector('.card-edit') as HTMLElement).textContent,
    ).toContain('Edit Concept');
  });

  it('renders Platform + Content Type strip with locked badge when both are set', () => {
    const fixture = setup(makeConcept({ platform: 'instagram', contentType: 'carousel' }));
    const row = fixture.nativeElement.querySelector('.platform-row') as HTMLElement;
    expect(row).not.toBeNull();
    expect(row.textContent).toContain('Instagram');
    expect(row.textContent).toContain('Carousel');
    expect(row.querySelector('.card-locked')?.textContent).toContain('Locked');
  });

  it('hides the platform strip when platform is unset', () => {
    const fixture = setup(makeConcept({ platform: undefined, contentType: undefined }));
    expect(fixture.nativeElement.querySelector('.platform-row')).toBeNull();
  });

  it('renders Strategy heading + Objective row when objectives are provided', () => {
    const fixture = setup(makeConcept({ objectiveId: 'obj-1' }));
    expect(fixture.nativeElement.querySelector('.strategy-section')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.strategy-title')?.textContent?.trim()).toBe('Strategy');
    expect(fixture.nativeElement.textContent).toContain('Q3 awareness lift');
  });

  it('renders description excerpt, hook, business objective, pillars, segments, and goal', () => {
    const fixture = setup(makeConcept());
    expect(fixture.nativeElement.querySelector('.card-description')?.textContent).toContain(
      'breath techniques',
    );
    expect(fixture.nativeElement.querySelector('.concept-hook')?.textContent).toContain(
      'Stop scrolling',
    );
    expect(fixture.nativeElement.textContent).toContain('Q3 awareness lift');
    expect(fixture.nativeElement.querySelectorAll('.chip-grid--pillar .chip').length).toBe(1);
    expect(fixture.nativeElement.querySelectorAll('.chip-grid--segment .chip').length).toBe(1);
  });

  it('clicking Edit Concept emits editConcept', () => {
    const fixture = setup(makeConcept());
    let fired = 0;
    fixture.componentInstance.editConcept.subscribe(() => fired++);
    (fixture.nativeElement.querySelector('.card-edit') as HTMLButtonElement).click();
    expect(fired).toBe(1);
  });

  it('hides hook / pillars / segments / goal sections when their data is missing', () => {
    const fixture = setup(
      makeConcept({
        hook: undefined,
        pillarIds: [],
        segmentIds: [],
        objective: undefined,
        objectiveId: undefined,
      }),
    );
    expect(fixture.nativeElement.querySelector('.concept-hook')).toBeNull();
    expect(fixture.nativeElement.querySelector('.chip-grid--pillar')).toBeNull();
    expect(fixture.nativeElement.querySelector('.chip-grid--segment')).toBeNull();
    // Goal section relies on objective label resolving — should be absent
    expect(fixture.nativeElement.textContent).not.toContain('Q3 awareness');
  });

  it('pillar chips carry the pillar.color tint via inline style bindings', () => {
    const fixture = setup(makeConcept({ pillarIds: ['p1', 'p2'] }));
    const chips = Array.from(
      fixture.nativeElement.querySelectorAll('.chip-grid--pillar .chip') as NodeListOf<HTMLElement>,
    );
    expect(chips.length).toBe(2);
    // Inline style binds — non-null colour string
    expect(chips[0].style.color).not.toBe('');
    expect(chips[0].style.borderColor).not.toBe('');
  });
});
