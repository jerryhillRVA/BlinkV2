import { TestBed } from '@angular/core/testing';
import { StrategicPillarsComponent } from './strategic-pillars.component';
import { AI_SIMULATION_DELAY_MS } from '../../strategy-research.constants';

describe('StrategicPillarsComponent', () => {
  let component: StrategicPillarsComponent;
  let fixture: ReturnType<typeof TestBed.createComponent<StrategicPillarsComponent>>;
  let nativeElement: HTMLElement;

  beforeEach(async () => {
    vi.useFakeTimers();
    await TestBed.configureTestingModule({
      imports: [StrategicPillarsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StrategicPillarsComponent);
    component = fixture.componentInstance;
    nativeElement = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // --- Rendering ---

  it('should render pillar cards', () => {
    const cards = nativeElement.querySelectorAll('.pillar-card');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('should show add pillar button', () => {
    const btn = nativeElement.querySelector('.btn-add');
    expect(btn).toBeTruthy();
    expect(btn?.textContent).toContain('Add Pillar');
  });

  it('should not show add form initially', () => {
    expect(nativeElement.querySelector('.add-form')).toBeFalsy();
  });

  it('should render section header', () => {
    expect(nativeElement.querySelector('.section-header h2')?.textContent).toContain('Strategic Pillars');
  });

  it('should render distribution section', () => {
    expect(nativeElement.querySelector('.distribution-section')).toBeTruthy();
    expect(nativeElement.querySelector('.distribution-section h3')?.textContent).toContain('Content Distribution Analysis');
  });

  // --- Add form ---

  it('should open add form and reset fields', () => {
    component.newPillarName = 'leftover';
    component.openAddForm();
    expect(component.showAddForm()).toBe(true);
    expect(component.newPillarName).toBe('');
    expect(component.newPillarDescription).toBe('');
    expect(component.editingId()).toBeNull();
  });

  it('should render add form when showAddForm is true', () => {
    component.openAddForm();
    fixture.detectChanges();

    expect(nativeElement.querySelector('.add-form')).toBeTruthy();
    expect(nativeElement.querySelector('.add-form h3')?.textContent).toContain('New Pillar');
  });

  it('should render color swatches in add form', () => {
    component.openAddForm();
    fixture.detectChanges();

    const swatches = nativeElement.querySelectorAll('.add-form .color-swatch');
    expect(swatches.length).toBe(10);
  });

  it('should cancel add form', () => {
    component.openAddForm();
    expect(component.showAddForm()).toBe(true);
    component.cancelAdd();
    expect(component.showAddForm()).toBe(false);
  });

  it('should add a new pillar', () => {
    const initialCount = component.pillars().length;
    component.newPillarName = 'Test Pillar';
    component.newPillarDescription = 'Test description';
    component.newPillarColor = '#d94e33';
    component.addPillar();

    expect(component.pillars().length).toBe(initialCount + 1);
    const added = component.pillars()[component.pillars().length - 1];
    expect(added.name).toBe('Test Pillar');
    expect(added.description).toBe('Test description');
    expect(added.color).toBe('#d94e33');
    expect(added.goals).toEqual([]);
    expect(component.showAddForm()).toBe(false);
  });

  it('should not add pillar with empty name', () => {
    const initialCount = component.pillars().length;
    component.newPillarName = '   ';
    component.addPillar();
    expect(component.pillars().length).toBe(initialCount);
  });

  // --- Edit ---

  it('should start editing a pillar', () => {
    const pillar = component.pillars()[0];
    component.startEdit(pillar);
    expect(component.editingId()).toBe(pillar.id);
    expect(component.editName).toBe(pillar.name);
    expect(component.editDescription).toBe(pillar.description);
    expect(component.editColor).toBe(pillar.color);
    expect(component.showAddForm()).toBe(false);
  });

  it('should render edit form when editingId matches', () => {
    const pillar = component.pillars()[0];
    component.startEdit(pillar);
    fixture.detectChanges();

    expect(nativeElement.querySelector('.edit-form')).toBeTruthy();
  });

  it('should close add form when starting edit', () => {
    component.openAddForm();
    expect(component.showAddForm()).toBe(true);

    const pillar = component.pillars()[0];
    component.startEdit(pillar);
    expect(component.showAddForm()).toBe(false);
  });

  it('should cancel edit', () => {
    const pillar = component.pillars()[0];
    component.startEdit(pillar);
    expect(component.editingId()).toBe(pillar.id);

    component.cancelEdit();
    expect(component.editingId()).toBeNull();
  });

  it('should save edit', () => {
    const pillar = component.pillars()[0];
    component.startEdit(pillar);

    component.editName = 'Updated Name';
    component.editDescription = 'Updated Desc';
    component.editColor = '#f59e0b';
    component.saveEdit(pillar.id);

    const updated = component.pillars().find(p => p.id === pillar.id)!;
    expect(updated.name).toBe('Updated Name');
    expect(updated.description).toBe('Updated Desc');
    expect(updated.color).toBe('#f59e0b');
    expect(component.editingId()).toBeNull();
  });

  // --- Delete ---

  it('should delete a pillar', () => {
    const initialCount = component.pillars().length;
    const firstId = component.pillars()[0].id;
    component.deletePillar(firstId);
    expect(component.pillars().length).toBe(initialCount - 1);
    expect(component.pillars().find(p => p.id === firstId)).toBeUndefined();
  });

  // --- Goal progress ---

  it('should return 0 when goal has no current value', () => {
    expect(component.getGoalProgress({ id: 'g1', metric: 'Views', target: 100, unit: 'views', period: 'monthly' })).toBe(0);
  });

  it('should return 0 when goal target is 0', () => {
    expect(component.getGoalProgress({ id: 'g1', metric: 'Views', target: 0, current: 50, unit: 'views', period: 'monthly' })).toBe(0);
  });

  it('should calculate correct progress percentage', () => {
    expect(component.getGoalProgress({ id: 'g1', metric: 'Views', target: 100, current: 50, unit: 'views', period: 'monthly' })).toBe(50);
  });

  it('should cap progress at 100%', () => {
    expect(component.getGoalProgress({ id: 'g1', metric: 'Views', target: 50, current: 100, unit: 'views', period: 'monthly' })).toBe(100);
  });

  it('should round progress to nearest integer', () => {
    expect(component.getGoalProgress({ id: 'g1', metric: 'Views', target: 3, current: 1, unit: 'views', period: 'monthly' })).toBe(33);
  });

  // --- Analyze distribution ---

  it('should analyze distribution (timer-based)', () => {
    component.analyzeDistribution();
    expect(component.isAnalyzing()).toBe(true);

    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    expect(component.isAnalyzing()).toBe(false);
  });

  it('should show spinner during analysis', () => {
    component.analyzeDistribution();
    fixture.detectChanges();

    const btn = nativeElement.querySelector('.btn-analyze') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(btn.textContent).toContain('Analyzing...');
    expect(nativeElement.querySelector('.btn-analyze .spinner')).toBeTruthy();

    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    fixture.detectChanges();

    expect(btn.disabled).toBe(false);
    expect(btn.textContent).toContain('Analyze');
  });

  // --- Posts per week ---

  it('should have default posts per week of 7', () => {
    expect(component.postsPerWeek()).toBe(7);
  });

  // --- Preset colors ---

  it('should have 10 preset colors', () => {
    expect(component.presetColors.length).toBe(10);
  });

  // --- View mode vs edit mode rendering ---

  it('should show view mode with name and description by default', () => {
    const cardHeader = nativeElement.querySelector('.card-header h3');
    expect(cardHeader).toBeTruthy();
    expect(nativeElement.querySelector('.card-description')).toBeTruthy();
  });

  it('should show card action buttons (edit and delete) in view mode', () => {
    const editBtn = nativeElement.querySelector('.card-actions .btn-icon');
    const deleteBtn = nativeElement.querySelector('.card-actions .btn-delete');
    expect(editBtn).toBeTruthy();
    expect(deleteBtn).toBeTruthy();
  });

  // --- Goals rendering ---

  it('should render goals section when pillar has goals', () => {
    component.pillars.update(list =>
      list.map((p, i) =>
        i === 0
          ? {
              ...p,
              goals: [
                { id: 'g1', metric: 'Views', target: 1000, current: 500, unit: 'views', period: 'monthly' as const },
                { id: 'g2', metric: 'Likes', target: 200, current: 50, unit: 'likes', period: 'monthly' as const },
              ],
            }
          : p
      )
    );
    fixture.detectChanges();

    const goalsSection = nativeElement.querySelector('.goals-section');
    expect(goalsSection).toBeTruthy();
    expect(goalsSection?.querySelector('h4')?.textContent).toContain('Goals');
    const goalItems = nativeElement.querySelectorAll('.goal-item');
    expect(goalItems.length).toBe(2);
  });

  it('should render goal progress bars with correct width', () => {
    component.pillars.update(list =>
      list.map((p, i) =>
        i === 0
          ? {
              ...p,
              goals: [{ id: 'g1', metric: 'Views', target: 100, current: 75, unit: 'views', period: 'monthly' as const }],
            }
          : p
      )
    );
    fixture.detectChanges();

    const progressFill = nativeElement.querySelector('.progress-fill') as HTMLElement;
    expect(progressFill).toBeTruthy();
    expect(progressFill.style.width).toBe('75%');
  });

  it('should display goal metric and value text', () => {
    component.pillars.update(list =>
      list.map((p, i) =>
        i === 0
          ? {
              ...p,
              goals: [{ id: 'g1', metric: 'Views', target: 100, current: 50, unit: 'views', period: 'monthly' as const }],
            }
          : p
      )
    );
    fixture.detectChanges();

    const goalLabel = nativeElement.querySelector('.goal-label');
    expect(goalLabel?.textContent).toContain('Views');
    expect(goalLabel?.textContent).toContain('50 / 100 views');
  });

  it('should not render goals section when pillar has no goals', () => {
    // Default pillars have no goals
    const goalsSection = nativeElement.querySelector('.goals-section');
    expect(goalsSection).toBeFalsy();
  });

  it('should not render goals section when pillar has empty goals array', () => {
    component.pillars.update(list =>
      list.map((p, i) => (i === 0 ? { ...p, goals: [] } : p))
    );
    fixture.detectChanges();
    expect(nativeElement.querySelector('.goals-section')).toBeFalsy();
  });

  it('should display goal value with 0 when current is undefined', () => {
    component.pillars.update(list =>
      list.map((p, i) =>
        i === 0
          ? {
              ...p,
              goals: [{ id: 'g1', metric: 'Reach', target: 500, unit: 'impressions', period: 'monthly' as const }],
            }
          : p
      )
    );
    fixture.detectChanges();

    const goalValue = nativeElement.querySelector('.goal-value');
    expect(goalValue?.textContent).toContain('0 / 500');
  });

  // --- Color swatch click in add form ---

  it('should change newPillarColor when clicking a color swatch in add form', () => {
    component.openAddForm();
    fixture.detectChanges();

    const swatches = nativeElement.querySelectorAll('.add-form .color-swatch') as NodeListOf<HTMLButtonElement>;
    expect(swatches.length).toBeGreaterThan(1);

    // Click the second swatch
    swatches[1].click();
    fixture.detectChanges();
    expect(component.newPillarColor).toBe(component.presetColors[1]);
  });

  // --- Color swatch click in edit form ---

  it('should change editColor when clicking a color swatch in edit form', () => {
    const pillar = component.pillars()[0];
    component.startEdit(pillar);
    fixture.detectChanges();

    const swatches = nativeElement.querySelectorAll('.edit-form .color-swatch') as NodeListOf<HTMLButtonElement>;
    expect(swatches.length).toBeGreaterThan(1);

    swatches[2].click();
    fixture.detectChanges();
    expect(component.editColor).toBe(component.presetColors[2]);
  });

  // --- Edit and Delete via DOM clicks ---

  it('should start edit when clicking the edit button in DOM', () => {
    const editBtn = nativeElement.querySelector('.card-actions .btn-icon') as HTMLButtonElement;
    editBtn.click();
    fixture.detectChanges();

    expect(component.editingId()).toBe(component.pillars()[0].id);
    expect(nativeElement.querySelector('.edit-form')).toBeTruthy();
  });

  it('should delete pillar when clicking the delete button in DOM', () => {
    const initialCount = component.pillars().length;
    const deleteBtn = nativeElement.querySelector('.card-actions .btn-delete') as HTMLButtonElement;
    deleteBtn.click();
    fixture.detectChanges();

    expect(component.pillars().length).toBe(initialCount - 1);
  });

  it('should cancel edit from DOM cancel button', () => {
    const pillar = component.pillars()[0];
    component.startEdit(pillar);
    fixture.detectChanges();

    const cancelBtn = nativeElement.querySelector('.edit-form .btn-cancel') as HTMLButtonElement;
    cancelBtn.click();
    fixture.detectChanges();

    expect(component.editingId()).toBeNull();
    expect(nativeElement.querySelector('.edit-form')).toBeFalsy();
  });

  it('should save edit from DOM save button', () => {
    const pillar = component.pillars()[0];
    component.startEdit(pillar);
    component.editName = 'DOM Saved';
    fixture.detectChanges();

    const saveBtn = nativeElement.querySelector('.edit-form .btn-save') as HTMLButtonElement;
    saveBtn.click();
    fixture.detectChanges();

    expect(component.pillars()[0].name).toBe('DOM Saved');
  });

  // --- Add form DOM interactions ---

  it('should cancel add form via DOM cancel button', () => {
    component.openAddForm();
    fixture.detectChanges();

    const cancelBtn = nativeElement.querySelector('.add-form .btn-cancel') as HTMLButtonElement;
    cancelBtn.click();
    fixture.detectChanges();

    expect(component.showAddForm()).toBe(false);
    expect(nativeElement.querySelector('.add-form')).toBeFalsy();
  });

  it('should add pillar via DOM save button', () => {
    component.openAddForm();
    component.newPillarName = 'DOM Pillar';
    component.newPillarDescription = 'DOM desc';
    fixture.detectChanges();

    const saveBtn = nativeElement.querySelector('.add-form .btn-save') as HTMLButtonElement;
    saveBtn.click();
    fixture.detectChanges();

    const lastPillar = component.pillars()[component.pillars().length - 1];
    expect(lastPillar.name).toBe('DOM Pillar');
  });

  // --- postsPerWeek signal update ---

  it('should update postsPerWeek signal', () => {
    component.postsPerWeek.set(14);
    expect(component.postsPerWeek()).toBe(14);
  });

  // --- Analyze via DOM click ---

  it('should trigger analyzeDistribution via DOM button click', () => {
    const analyzeBtn = nativeElement.querySelector('.btn-analyze') as HTMLButtonElement;
    analyzeBtn.click();
    expect(component.isAnalyzing()).toBe(true);
    vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
    expect(component.isAnalyzing()).toBe(false);
  });

  // --- Color swatch selected class ---

  it('should apply selected class to matching color swatch in add form', () => {
    component.openAddForm();
    fixture.detectChanges();

    const swatches = nativeElement.querySelectorAll('.add-form .color-swatch');
    expect(swatches[0].classList.contains('selected')).toBe(true);
    expect(swatches[1].classList.contains('selected')).toBe(false);
  });

  it('should apply selected class to matching color swatch in edit form', () => {
    const pillar = component.pillars()[0];
    component.startEdit(pillar);
    fixture.detectChanges();

    const swatches = nativeElement.querySelectorAll('.edit-form .color-swatch');
    const selectedIndex = component.presetColors.indexOf(pillar.color);
    if (selectedIndex >= 0) {
      expect(swatches[selectedIndex].classList.contains('selected')).toBe(true);
    }
  });

  // --- Pillar card border color ---

  it('should apply border-top-color to pillar cards', () => {
    const card = nativeElement.querySelector('.pillar-card') as HTMLElement;
    expect(card).toBeTruthy();
    expect(card.style.borderTopColor).toBeTruthy();
  });

  // --- Multiple pillar rendering ---

  it('should render correct number of pillar cards', () => {
    const cards = nativeElement.querySelectorAll('.pillar-card');
    expect(cards.length).toBe(component.pillars().length);
  });

  // --- Render all pillar names and descriptions ---

  it('should render pillar names and descriptions in view mode', () => {
    const names = nativeElement.querySelectorAll('.card-header h3');
    const descriptions = nativeElement.querySelectorAll('.card-description');
    expect(names.length).toBe(component.pillars().length);
    expect(descriptions.length).toBe(component.pillars().length);
    expect(names[0].textContent?.trim()).toBe(component.pillars()[0].name);
  });

  // --- Edit form renders color swatches ---

  it('should render color swatches in edit form', () => {
    const pillar = component.pillars()[0];
    component.startEdit(pillar);
    fixture.detectChanges();

    const swatches = nativeElement.querySelectorAll('.edit-form .color-swatch');
    expect(swatches.length).toBe(10);
  });

  // --- postsPerWeek ngModelChange via DOM ---

  it('should update postsPerWeek via number input ngModelChange in DOM', () => {
    const input = nativeElement.querySelector('.distribution-controls input[type="number"]') as HTMLInputElement;
    input.value = '14';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(component.postsPerWeek()).toBe(14);
  });

  // --- Add form ngModel bindings ---

  it('should bind newPillarName via input in add form', () => {
    component.openAddForm();
    fixture.detectChanges();

    const inputs = nativeElement.querySelectorAll('.add-form input[type="text"]') as NodeListOf<HTMLInputElement>;
    inputs[0].value = 'New Name';
    inputs[0].dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(component.newPillarName).toBe('New Name');
  });

  it('should bind newPillarDescription via textarea in add form', () => {
    component.openAddForm();
    fixture.detectChanges();

    const textarea = nativeElement.querySelector('.add-form textarea') as HTMLTextAreaElement;
    textarea.value = 'New Description';
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(component.newPillarDescription).toBe('New Description');
  });

  // --- Edit form ngModel bindings ---

  it('should bind editName via input in edit form', () => {
    const pillar = component.pillars()[0];
    component.startEdit(pillar);
    fixture.detectChanges();

    const inputs = nativeElement.querySelectorAll('.edit-form input[type="text"]') as NodeListOf<HTMLInputElement>;
    inputs[0].value = 'Edited Name';
    inputs[0].dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(component.editName).toBe('Edited Name');
  });

  it('should bind editDescription via textarea in edit form', () => {
    const pillar = component.pillars()[0];
    component.startEdit(pillar);
    fixture.detectChanges();

    const textarea = nativeElement.querySelector('.edit-form textarea') as HTMLTextAreaElement;
    textarea.value = 'Edited Description';
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(component.editDescription).toBe('Edited Description');
  });
});
