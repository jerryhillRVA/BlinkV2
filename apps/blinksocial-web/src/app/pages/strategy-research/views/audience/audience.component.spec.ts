import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AudienceComponent } from './audience.component';

describe('AudienceComponent', () => {
  let component: AudienceComponent;
  let fixture: ComponentFixture<AudienceComponent>;

  beforeEach(async () => {
    vi.useFakeTimers();
    await TestBed.configureTestingModule({
      imports: [AudienceComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AudienceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initial state', () => {
    it('should have segments loaded from DEFAULT_SEGMENTS', () => {
      expect(component.segments().length).toBe(5);
    });

    it('should have segments with journey stages initialized', () => {
      const first = component.segments()[0];
      expect(first.journeyStages).toBeTruthy();
      expect(first.journeyStages!.length).toBe(4);
    });

    it('should have empty journey stage goals initially', () => {
      const first = component.segments()[0];
      expect(first.journeyStages![0].primaryGoal).toBe('');
    });

    it('should have no expanded segments', () => {
      expect(component.expandedSegments().size).toBe(0);
    });

    it('should have null mappingSegmentId', () => {
      expect(component.mappingSegmentId()).toBeNull();
    });

    it('should have null editingId', () => {
      expect(component.editingId()).toBeNull();
    });

    it('should have journey stages array', () => {
      expect(component.journeyStages).toEqual(['awareness', 'consideration', 'conversion', 'retention']);
    });

    it('should have stage labels', () => {
      expect(component.stageLabels['awareness']).toBe('Awareness');
      expect(component.stageLabels['consideration']).toBe('Consideration');
      expect(component.stageLabels['conversion']).toBe('Conversion');
      expect(component.stageLabels['retention']).toBe('Retention');
    });

    it('should have empty editName and editDescription', () => {
      expect(component.editName).toBe('');
      expect(component.editDescription).toBe('');
    });
  });

  describe('template rendering', () => {
    it('should render section header', () => {
      const header = fixture.nativeElement.querySelector('.section-header h2');
      expect(header).toBeTruthy();
      expect(header.textContent).toContain('Audience Segments');
    });

    it('should render segment cards', () => {
      const cards = fixture.nativeElement.querySelectorAll('.segment-card');
      expect(cards.length).toBe(5);
    });

    it('should render segment names', () => {
      const names = fixture.nativeElement.querySelectorAll('.card-title-group h3');
      expect(names.length).toBe(5);
      expect(names[0].textContent).toContain('Active 40s');
    });

    it('should render segment descriptions', () => {
      const descriptions = fixture.nativeElement.querySelectorAll('.card-description');
      expect(descriptions.length).toBe(5);
    });

    it('should render edit and delete buttons for each segment', () => {
      const editBtns = fixture.nativeElement.querySelectorAll('.btn-icon:not(.btn-delete)');
      expect(editBtns.length).toBe(5);
      const deleteBtns = fixture.nativeElement.querySelectorAll('.btn-delete');
      expect(deleteBtns.length).toBe(5);
    });

    it('should render journey toggle buttons', () => {
      const toggleBtns = fixture.nativeElement.querySelectorAll('.btn-journey-toggle');
      expect(toggleBtns.length).toBe(5);
    });

    it('should render map journey AI buttons', () => {
      const aiBtns = fixture.nativeElement.querySelectorAll('.btn-ai');
      expect(aiBtns.length).toBe(5);
      expect(aiBtns[0].textContent).toContain('Map Journey');
    });

    it('should not show journey stages initially', () => {
      const journeyStages = fixture.nativeElement.querySelector('.journey-stages');
      expect(journeyStages).toBeFalsy();
    });

    it('should not show edit form initially', () => {
      const editForm = fixture.nativeElement.querySelector('.edit-form');
      expect(editForm).toBeFalsy();
    });
  });

  describe('toggleJourney()', () => {
    it('should expand a segment', () => {
      const segmentId = component.segments()[0].id;
      component.toggleJourney(segmentId);
      expect(component.isExpanded(segmentId)).toBe(true);
    });

    it('should collapse an expanded segment', () => {
      const segmentId = component.segments()[0].id;
      component.toggleJourney(segmentId);
      component.toggleJourney(segmentId);
      expect(component.isExpanded(segmentId)).toBe(false);
    });

    it('should allow multiple segments to be expanded', () => {
      const id1 = component.segments()[0].id;
      const id2 = component.segments()[1].id;
      component.toggleJourney(id1);
      component.toggleJourney(id2);
      expect(component.isExpanded(id1)).toBe(true);
      expect(component.isExpanded(id2)).toBe(true);
    });

    it('should render journey stages section when expanded', () => {
      const segmentId = component.segments()[0].id;
      component.toggleJourney(segmentId);
      fixture.detectChanges();
      const journeyStages = fixture.nativeElement.querySelector('.journey-stages');
      expect(journeyStages).toBeTruthy();
      const stageCards = fixture.nativeElement.querySelectorAll('.stage-card');
      expect(stageCards.length).toBe(4);
    });

    it('should show stage labels when expanded', () => {
      const segmentId = component.segments()[0].id;
      component.toggleJourney(segmentId);
      fixture.detectChanges();
      const labels = fixture.nativeElement.querySelectorAll('.stage-label');
      expect(labels.length).toBe(4);
      expect(labels[0].textContent).toContain('Awareness');
    });

    it('should show empty message for unmapped stages', () => {
      const segmentId = component.segments()[0].id;
      component.toggleJourney(segmentId);
      fixture.detectChanges();
      const emptyMessages = fixture.nativeElement.querySelectorAll('.stage-empty');
      expect(emptyMessages.length).toBe(4);
      expect(emptyMessages[0].textContent).toContain('Use "Map Journey"');
    });

    it('should add rotated class to chevron when expanded', () => {
      const segmentId = component.segments()[0].id;
      component.toggleJourney(segmentId);
      fixture.detectChanges();
      const rotatedSvg = fixture.nativeElement.querySelector('.btn-journey-toggle svg.rotated');
      expect(rotatedSvg).toBeTruthy();
    });
  });

  describe('isExpanded()', () => {
    it('should return false for non-expanded segment', () => {
      expect(component.isExpanded('s1')).toBe(false);
    });

    it('should return true for expanded segment', () => {
      component.toggleJourney('s1');
      expect(component.isExpanded('s1')).toBe(true);
    });
  });

  describe('startEdit()', () => {
    it('should set editingId to segment id', () => {
      const segment = component.segments()[0];
      component.startEdit(segment);
      expect(component.editingId()).toBe(segment.id);
    });

    it('should populate editName with segment name', () => {
      const segment = component.segments()[0];
      component.startEdit(segment);
      expect(component.editName).toBe(segment.name);
    });

    it('should populate editDescription with segment description', () => {
      const segment = component.segments()[0];
      component.startEdit(segment);
      expect(component.editDescription).toBe(segment.description);
    });

    it('should show edit form in template', () => {
      const segment = component.segments()[0];
      component.startEdit(segment);
      fixture.detectChanges();
      const editForm = fixture.nativeElement.querySelector('.edit-form');
      expect(editForm).toBeTruthy();
      const nameInput = editForm.querySelector('input[type="text"]');
      expect(nameInput).toBeTruthy();
      const textarea = editForm.querySelector('textarea');
      expect(textarea).toBeTruthy();
    });

    it('should show save and cancel buttons in edit mode', () => {
      const segment = component.segments()[0];
      component.startEdit(segment);
      fixture.detectChanges();
      const saveBtn = fixture.nativeElement.querySelector('.btn-save');
      const cancelBtn = fixture.nativeElement.querySelector('.btn-cancel');
      expect(saveBtn).toBeTruthy();
      expect(cancelBtn).toBeTruthy();
    });

    it('should hide view mode content when editing', () => {
      const segment = component.segments()[0];
      component.startEdit(segment);
      fixture.detectChanges();
      // The first card should show edit form, not card-header
      const firstCard = fixture.nativeElement.querySelector('.segment-card');
      const cardHeader = firstCard.querySelector('.card-header');
      expect(cardHeader).toBeFalsy();
    });
  });

  describe('cancelEdit()', () => {
    it('should set editingId to null', () => {
      const segment = component.segments()[0];
      component.startEdit(segment);
      component.cancelEdit();
      expect(component.editingId()).toBeNull();
    });

    it('should remove edit form from template', () => {
      const segment = component.segments()[0];
      component.startEdit(segment);
      fixture.detectChanges();
      component.cancelEdit();
      fixture.detectChanges();
      const editForm = fixture.nativeElement.querySelector('.edit-form');
      expect(editForm).toBeFalsy();
    });

    it('should be callable via cancel button click', () => {
      const segment = component.segments()[0];
      component.startEdit(segment);
      fixture.detectChanges();
      const cancelBtn = fixture.nativeElement.querySelector('.btn-cancel');
      cancelBtn.click();
      fixture.detectChanges();
      expect(component.editingId()).toBeNull();
    });
  });

  describe('saveEdit()', () => {
    it('should update segment name', () => {
      const segment = component.segments()[0];
      component.startEdit(segment);
      component.editName = 'New Name';
      component.saveEdit(segment.id);
      expect(component.segments()[0].name).toBe('New Name');
    });

    it('should update segment description', () => {
      const segment = component.segments()[0];
      component.startEdit(segment);
      component.editDescription = 'New Description';
      component.saveEdit(segment.id);
      expect(component.segments()[0].description).toBe('New Description');
    });

    it('should trim whitespace from name and description', () => {
      const segment = component.segments()[0];
      component.startEdit(segment);
      component.editName = '  Trimmed Name  ';
      component.editDescription = '  Trimmed Desc  ';
      component.saveEdit(segment.id);
      expect(component.segments()[0].name).toBe('Trimmed Name');
      expect(component.segments()[0].description).toBe('Trimmed Desc');
    });

    it('should set editingId to null after save', () => {
      const segment = component.segments()[0];
      component.startEdit(segment);
      component.saveEdit(segment.id);
      expect(component.editingId()).toBeNull();
    });

    it('should not change other segments', () => {
      const segment = component.segments()[0];
      const secondName = component.segments()[1].name;
      component.startEdit(segment);
      component.editName = 'Changed';
      component.saveEdit(segment.id);
      expect(component.segments()[1].name).toBe(secondName);
    });

    it('should be callable via save button click', () => {
      const segment = component.segments()[0];
      component.startEdit(segment);
      component.editName = 'Button Save';
      fixture.detectChanges();
      const saveBtn = fixture.nativeElement.querySelector('.btn-save');
      saveBtn.click();
      fixture.detectChanges();
      expect(component.segments()[0].name).toBe('Button Save');
      expect(component.editingId()).toBeNull();
    });
  });

  describe('deleteSegment()', () => {
    it('should remove segment by id', () => {
      const initialCount = component.segments().length;
      const firstId = component.segments()[0].id;
      component.deleteSegment(firstId);
      expect(component.segments().length).toBe(initialCount - 1);
    });

    it('should remove the correct segment', () => {
      const firstId = component.segments()[0].id;
      component.deleteSegment(firstId);
      const ids = component.segments().map(s => s.id);
      expect(ids).not.toContain(firstId);
    });

    it('should update DOM after deletion', () => {
      const firstId = component.segments()[0].id;
      component.deleteSegment(firstId);
      fixture.detectChanges();
      const cards = fixture.nativeElement.querySelectorAll('.segment-card');
      expect(cards.length).toBe(4);
    });

    it('should be callable via delete button click', () => {
      const initialCount = component.segments().length;
      fixture.detectChanges();
      const deleteBtn = fixture.nativeElement.querySelector('.btn-delete');
      deleteBtn.click();
      fixture.detectChanges();
      expect(component.segments().length).toBe(initialCount - 1);
    });
  });

  describe('mapJourney()', () => {
    it('should set mappingSegmentId', () => {
      const segmentId = component.segments()[0].id;
      component.mapJourney(segmentId);
      expect(component.mappingSegmentId()).toBe(segmentId);
    });

    it('should show spinner on the mapping segment AI button', () => {
      const segmentId = component.segments()[0].id;
      component.mapJourney(segmentId);
      fixture.detectChanges();
      const spinner = fixture.nativeElement.querySelector('.spinner');
      expect(spinner).toBeTruthy();
      const aiBtn = fixture.nativeElement.querySelector('.btn-ai[disabled]');
      expect(aiBtn).toBeTruthy();
    });

    it('should populate journey stages after timeout', () => {
      const segmentId = component.segments()[0].id;
      component.mapJourney(segmentId);
      vi.advanceTimersByTime(2500);
      const segment = component.segments().find(s => s.id === segmentId)!;
      expect(segment.journeyStages![0].primaryGoal).toContain('AI-generated goal');
    });

    it('should set mappingSegmentId to null after completion', () => {
      const segmentId = component.segments()[0].id;
      component.mapJourney(segmentId);
      vi.advanceTimersByTime(2500);
      expect(component.mappingSegmentId()).toBeNull();
    });

    it('should auto-expand the segment after mapping', () => {
      const segmentId = component.segments()[0].id;
      component.mapJourney(segmentId);
      vi.advanceTimersByTime(2500);
      expect(component.isExpanded(segmentId)).toBe(true);
    });

    it('should populate content types for all stages', () => {
      const segmentId = component.segments()[0].id;
      component.mapJourney(segmentId);
      vi.advanceTimersByTime(2500);
      const segment = component.segments().find(s => s.id === segmentId)!;
      for (const stage of segment.journeyStages!) {
        expect(stage.contentTypes).toEqual(['Short-form video', 'Carousel', 'Story']);
      }
    });

    it('should populate hook angles for all stages', () => {
      const segmentId = component.segments()[0].id;
      component.mapJourney(segmentId);
      vi.advanceTimersByTime(2500);
      const segment = component.segments().find(s => s.id === segmentId)!;
      for (const stage of segment.journeyStages!) {
        expect(stage.hookAngles).toEqual(['Pain point', 'Transformation', 'Quick tip']);
      }
    });

    it('should populate success metrics for all stages', () => {
      const segmentId = component.segments()[0].id;
      component.mapJourney(segmentId);
      vi.advanceTimersByTime(2500);
      const segment = component.segments().find(s => s.id === segmentId)!;
      expect(segment.journeyStages![0].successMetric).toContain('Awareness engagement rate');
    });

    it('should not modify other segments', () => {
      const segmentId = component.segments()[0].id;
      const secondSegment = component.segments()[1];
      component.mapJourney(segmentId);
      vi.advanceTimersByTime(2500);
      const updatedSecond = component.segments().find(s => s.id === secondSegment.id)!;
      expect(updatedSecond.journeyStages![0].primaryGoal).toBe('');
    });

    it('should render mapped stage data in DOM after mapping and expanding', () => {
      const segmentId = component.segments()[0].id;
      component.mapJourney(segmentId);
      vi.advanceTimersByTime(2500);
      fixture.detectChanges();
      const stageFields = fixture.nativeElement.querySelectorAll('.stage-field');
      expect(stageFields.length).toBeGreaterThan(0);
      const chips = fixture.nativeElement.querySelectorAll('.chip');
      expect(chips.length).toBeGreaterThan(0);
    });

    it('should show goal, content types, hook angles, and success metric for mapped stages', () => {
      const segmentId = component.segments()[0].id;
      component.mapJourney(segmentId);
      vi.advanceTimersByTime(2500);
      fixture.detectChanges();
      // 4 stages x 4 fields = 16 stage-field divs
      const stageFields = fixture.nativeElement.querySelectorAll('.stage-field');
      expect(stageFields.length).toBe(16);
    });
  });

  describe('getStage()', () => {
    it('should return the matching stage', () => {
      const segment = component.segments()[0];
      const stage = component.getStage(segment, 'awareness');
      expect(stage).toBeTruthy();
      expect(stage!.stage).toBe('awareness');
    });

    it('should return undefined for non-existent stage when journeyStages is undefined', () => {
      const segment = { id: 'test', name: 'Test', description: 'Test' };
      const stage = component.getStage(segment, 'awareness');
      expect(stage).toBeUndefined();
    });

    it('should return correct stage data after mapping', () => {
      const segmentId = component.segments()[0].id;
      component.mapJourney(segmentId);
      vi.advanceTimersByTime(2500);
      const segment = component.segments()[0];
      const stage = component.getStage(segment, 'conversion');
      expect(stage).toBeTruthy();
      expect(stage!.primaryGoal).toContain('AI-generated goal for Conversion');
    });
  });

  // --- DOM interactions for template function/branch coverage ---

  describe('DOM interactions', () => {
    it('should trigger startEdit via edit button click in DOM', () => {
      const editBtn = fixture.nativeElement.querySelector('.btn-icon:not(.btn-delete)') as HTMLButtonElement;
      editBtn.click();
      fixture.detectChanges();
      expect(component.editingId()).toBe(component.segments()[0].id);
      expect(fixture.nativeElement.querySelector('.edit-form')).toBeTruthy();
    });

    it('should trigger deleteSegment via delete button click in DOM', () => {
      const initialCount = component.segments().length;
      const deleteBtn = fixture.nativeElement.querySelector('.btn-delete') as HTMLButtonElement;
      deleteBtn.click();
      fixture.detectChanges();
      expect(component.segments().length).toBe(initialCount - 1);
    });

    it('should trigger toggleJourney via journey toggle button click in DOM', () => {
      const toggleBtn = fixture.nativeElement.querySelector('.btn-journey-toggle') as HTMLButtonElement;
      toggleBtn.click();
      fixture.detectChanges();
      expect(component.isExpanded(component.segments()[0].id)).toBe(true);
      expect(fixture.nativeElement.querySelector('.journey-stages')).toBeTruthy();
    });

    it('should trigger mapJourney via AI button click in DOM', () => {
      const aiBtn = fixture.nativeElement.querySelector('.btn-ai') as HTMLButtonElement;
      aiBtn.click();
      expect(component.mappingSegmentId()).toBe(component.segments()[0].id);
      fixture.detectChanges();
      expect(aiBtn.disabled).toBe(true);
      expect(aiBtn.textContent).toContain('Mapping...');

      vi.advanceTimersByTime(2500);
      fixture.detectChanges();
      expect(component.mappingSegmentId()).toBeNull();
    });

    it('should bind editName via input in edit form', () => {
      const segment = component.segments()[0];
      component.startEdit(segment);
      fixture.detectChanges();

      const nameInput = fixture.nativeElement.querySelector('.edit-form input[type="text"]') as HTMLInputElement;
      nameInput.value = 'DOM Edited Name';
      nameInput.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      expect(component.editName).toBe('DOM Edited Name');
    });

    it('should bind editDescription via textarea in edit form', () => {
      const segment = component.segments()[0];
      component.startEdit(segment);
      fixture.detectChanges();

      const textarea = fixture.nativeElement.querySelector('.edit-form textarea') as HTMLTextAreaElement;
      textarea.value = 'DOM Edited Desc';
      textarea.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      expect(component.editDescription).toBe('DOM Edited Desc');
    });

    it('should show spinner on correct AI button while mapping', () => {
      const segmentId = component.segments()[0].id;
      component.mapJourney(segmentId);
      fixture.detectChanges();

      const firstCard = fixture.nativeElement.querySelector('.segment-card');
      const spinner = firstCard.querySelector('.spinner');
      expect(spinner).toBeTruthy();

      vi.advanceTimersByTime(2500);
      fixture.detectChanges();
    });

    it('should not show spinner on other segment AI buttons while mapping one', () => {
      const segmentId = component.segments()[0].id;
      component.mapJourney(segmentId);
      fixture.detectChanges();

      const cards = fixture.nativeElement.querySelectorAll('.segment-card');
      const secondCard = cards[1];
      const btn = secondCard.querySelector('.btn-ai') as HTMLButtonElement;
      expect(btn.disabled).toBe(false);
      expect(btn.textContent).toContain('Map Journey');

      vi.advanceTimersByTime(2500);
    });
  });
});
