import { TestBed } from '@angular/core/testing';
import { VoiceAttributesComponent } from './voice-attributes.component';

describe('VoiceAttributesComponent', () => {
  let component: VoiceAttributesComponent;
  let fixture: ReturnType<typeof TestBed.createComponent<VoiceAttributesComponent>>;
  let nativeElement: HTMLElement;

  beforeEach(async () => {
    vi.useFakeTimers();
    await TestBed.configureTestingModule({
      imports: [VoiceAttributesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(VoiceAttributesComponent);
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

  it('should generate attributes with AI', () => {
    component.generateAttributes();
    expect(component.isGenerating()).toBe(true);
    vi.advanceTimersByTime(2000);
    expect(component.isGenerating()).toBe(false);
    expect(component.attributes().length).toBe(4);
    expect(component.attributes()[0].label).toBe('Empowering');
  });

  it('should start adding a new attribute', () => {
    component.startAdd();
    expect(component.editingId()).toBeTruthy();
    expect(component.editAttribute().label).toBe('');
  });

  it('should show edit form when editing', () => {
    component.startAdd();
    fixture.detectChanges();
    expect(nativeElement.querySelector('.inline-form')).toBeTruthy();
  });

  it('should save a new attribute', () => {
    component.startAdd();
    component.editAttribute.set({
      id: component.editingId()!,
      label: 'Test Attr',
      description: 'Desc',
      doExample: 'Do this',
      dontExample: 'Not this',
    });
    component.save();
    expect(component.attributes().length).toBe(1);
    expect(component.attributes()[0].label).toBe('Test Attr');
    expect(component.editingId()).toBeNull();
  });

  it('should not save attribute with empty label', () => {
    component.startAdd();
    component.editAttribute.set({
      id: component.editingId()!,
      label: '   ',
      description: 'Desc',
      doExample: '',
      dontExample: '',
    });
    component.save();
    expect(component.attributes().length).toBe(0);
  });

  it('should edit an existing attribute', () => {
    component.startAdd();
    component.editAttribute.set({
      id: component.editingId()!,
      label: 'Original',
      description: 'Orig desc',
      doExample: '',
      dontExample: '',
    });
    component.save();

    const attr = component.attributes()[0];
    component.startEdit(attr);
    expect(component.editingId()).toBe(attr.id);
    component.updateField('label', 'Updated');
    component.save();
    expect(component.attributes()[0].label).toBe('Updated');
    expect(component.attributes().length).toBe(1);
  });

  it('should cancel editing', () => {
    component.startAdd();
    component.cancelEdit();
    expect(component.editingId()).toBeNull();
  });

  it('should remove an attribute', () => {
    component.startAdd();
    component.editAttribute.set({
      id: component.editingId()!,
      label: 'Remove Me',
      description: '',
      doExample: '',
      dontExample: '',
    });
    component.save();
    component.remove(component.attributes()[0].id);
    expect(component.attributes().length).toBe(0);
  });

  it('should render attribute cards', () => {
    component.generateAttributes();
    vi.advanceTimersByTime(2000);
    fixture.detectChanges();
    const cards = nativeElement.querySelectorAll('.attribute-card');
    expect(cards.length).toBe(4);
    expect(cards[0].querySelector('.attribute-label')?.textContent?.trim()).toBe('Empowering');
  });

  it('should update field', () => {
    component.updateField('label', 'New Label');
    expect(component.editAttribute().label).toBe('New Label');
  });

  it('should clean up timer on destroy', () => {
    component.generateAttributes();
    fixture.destroy();
    vi.advanceTimersByTime(2000);
  });
});
