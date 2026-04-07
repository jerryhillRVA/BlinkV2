import { TestBed } from '@angular/core/testing';
import { ObjectivesStripComponent } from './objectives-strip.component';
import type { BusinessObjective } from '../strategy-research.types';

describe('ObjectivesStripComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<ObjectivesStripComponent>>;
  let component: ObjectivesStripComponent;

  const mockObjectives: BusinessObjective[] = [
    { id: 'o1', category: 'growth', statement: 'Grow following to 10k', target: 10000, unit: 'followers', timeframe: 'Q2 2026', currentValue: 5000, status: 'on-track' },
    { id: 'o2', category: 'engagement', statement: 'Achieve 5% engagement', target: 5, unit: '%', timeframe: 'Q3 2026', currentValue: 3, status: 'at-risk' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ObjectivesStripComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ObjectivesStripComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should show empty state when no objectives', () => {
    fixture.detectChanges();
    const empty = fixture.nativeElement.querySelector('.empty-state');
    expect(empty).toBeTruthy();
    expect(empty.textContent).toContain('No objectives defined');
  });

  it('should show add objectives button in empty state', () => {
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('.add-objectives-btn');
    expect(btn).toBeTruthy();
  });

  it('should render objective cards when objectives provided', () => {
    fixture.componentRef.setInput('objectives', mockObjectives);
    fixture.detectChanges();
    const cards = fixture.nativeElement.querySelectorAll('.objective-card');
    expect(cards.length).toBe(2);
  });

  it('should display objective statement', () => {
    fixture.componentRef.setInput('objectives', mockObjectives);
    fixture.detectChanges();
    const statement = fixture.nativeElement.querySelector('.obj-statement');
    expect(statement.textContent).toContain('Grow following to 10k');
  });

  it('should display status badge', () => {
    fixture.componentRef.setInput('objectives', mockObjectives);
    fixture.detectChanges();
    const badges = fixture.nativeElement.querySelectorAll('.obj-status-badge');
    expect(badges[0].textContent.trim()).toBe('On Track');
    expect(badges[1].textContent.trim()).toBe('At Risk');
  });

  it('should calculate progress percent correctly', () => {
    expect(component.getProgressPercent(mockObjectives[0])).toBe(50);
    expect(component.getProgressPercent(mockObjectives[1])).toBe(60);
  });

  it('should return 0 for objectives without currentValue', () => {
    const obj: BusinessObjective = { id: 'o3', category: 'growth', statement: 'Test', target: 100, unit: '', timeframe: '', status: 'on-track' };
    expect(component.getProgressPercent(obj)).toBe(0);
  });

  it('should open drawer on edit click', () => {
    fixture.componentRef.setInput('objectives', mockObjectives);
    fixture.detectChanges();
    const editBtn = fixture.nativeElement.querySelector('.edit-btn');
    editBtn.click();
    fixture.detectChanges();
    expect(component.showDrawer()).toBe(true);
    const drawer = fixture.nativeElement.querySelector('.drawer');
    expect(drawer).toBeTruthy();
  });

  it('should close drawer on toggle', () => {
    component.showDrawer.set(true);
    component.toggleDrawer();
    expect(component.showDrawer()).toBe(false);
  });

  it('should emit objectivesChange on save', () => {
    const spy = vi.spyOn(component.objectivesChange, 'emit');
    fixture.componentRef.setInput('objectives', mockObjectives);
    component.openDrawer();
    component.saveObjectives();
    expect(spy).toHaveBeenCalled();
  });

  it('should render category chips in drawer', () => {
    fixture.detectChanges();
    component.openDrawer();
    fixture.detectChanges();
    const chips = fixture.nativeElement.querySelectorAll('.category-chip');
    expect(chips.length).toBe(6);
  });

  it('should not remove last objective', () => {
    fixture.detectChanges();
    component.openDrawer();
    const initialLength = component.dialogObjectives.length;
    component.removeObjective(component.dialogObjectives[0].id);
    expect(component.dialogObjectives.length).toBe(initialLength);
  });

  it('should add objective in drawer', () => {
    fixture.detectChanges();
    component.openDrawer();
    const initialLength = component.dialogObjectives.length;
    component.addObjective();
    expect(component.dialogObjectives.length).toBe(initialLength + 1);
  });

  it('should not exceed 4 objectives', () => {
    fixture.detectChanges();
    component.openDrawer();
    component.addObjective();
    component.addObjective();
    component.addObjective();
    component.addObjective();
    expect(component.dialogObjectives.length).toBeLessThanOrEqual(4);
  });

  it('should display edit button text', () => {
    fixture.componentRef.setInput('objectives', mockObjectives);
    fixture.detectChanges();
    const editBtn = fixture.nativeElement.querySelector('.edit-btn');
    expect(editBtn.textContent.trim()).toBe('Edit');
  });
});
