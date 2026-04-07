import { TestBed } from '@angular/core/testing';
import { ToneContextComponent } from './tone-context.component';

describe('ToneContextComponent', () => {
  let component: ToneContextComponent;
  let fixture: ReturnType<typeof TestBed.createComponent<ToneContextComponent>>;
  let nativeElement: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToneContextComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ToneContextComponent);
    component = fixture.componentInstance;
    nativeElement = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with mock tone contexts', () => {
    expect(component.toneContexts().length).toBe(4);
    expect(component.toneContexts()[0].context).toBe('Educational');
  });

  it('should show empty state when no tone contexts', () => {
    component.toneContexts.set([]);
    fixture.detectChanges();
    expect(nativeElement.querySelector('.empty-state')?.textContent).toContain('No tone contexts yet');
    expect(nativeElement.querySelector('.tone-table')).toBeFalsy();
  });

  it('should render tone table with initial data', () => {
    fixture.detectChanges();
    expect(nativeElement.querySelector('.tone-table')).toBeTruthy();
    expect(nativeElement.querySelectorAll('.tone-table tbody tr').length).toBe(4);
  });

  it('should start adding a new tone', () => {
    component.startAdd();
    expect(component.editingId()).toBeTruthy();
    expect(component.editTone().context).toBe('');
  });

  it('should save a new tone', () => {
    component.toneContexts.set([]);
    component.startAdd();
    component.editTone.set({
      id: component.editingId()!,
      context: 'Educational',
      tone: 'Clear',
      example: 'Example text',
    });
    component.save();
    expect(component.toneContexts().length).toBe(1);
    expect(component.editingId()).toBeNull();
  });

  it('should not save with empty context', () => {
    component.toneContexts.set([]);
    component.startAdd();
    component.editTone.set({ id: component.editingId()!, context: '   ', tone: 'Tone', example: '' });
    component.save();
    expect(component.toneContexts().length).toBe(0);
  });

  it('should edit an existing tone', () => {
    component.startEdit(component.toneContexts()[0]);
    component.updateField('context', 'Updated');
    component.save();
    expect(component.toneContexts()[0].context).toBe('Updated');
  });

  it('should cancel editing', () => {
    component.startAdd();
    component.cancelEdit();
    expect(component.editingId()).toBeNull();
  });

  it('should remove a tone', () => {
    const initialLength = component.toneContexts().length;
    component.remove(component.toneContexts()[0].id);
    expect(component.toneContexts().length).toBe(initialLength - 1);
  });

  it('should update edit tone fields', () => {
    component.updateField('context', 'New Context');
    expect(component.editTone().context).toBe('New Context');
    component.updateField('tone', 'New Tone');
    expect(component.editTone().tone).toBe('New Tone');
  });
});
