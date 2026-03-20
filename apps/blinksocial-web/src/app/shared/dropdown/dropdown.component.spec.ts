import { TestBed } from '@angular/core/testing';
import { DropdownComponent } from './dropdown.component';

const OPTIONS = [
  { value: 'youtube', label: 'YouTube' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'twitter', label: 'Twitter/X' },
];

describe('DropdownComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<DropdownComponent>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DropdownComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DropdownComponent);
    fixture.componentRef.setInput('options', OPTIONS);
    fixture.componentRef.setInput('value', 'youtube');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render trigger button with selected label', () => {
    const trigger = fixture.nativeElement.querySelector('.dropdown-trigger') as HTMLButtonElement;
    expect(trigger).toBeTruthy();
    expect(trigger.textContent).toContain('YouTube');
  });

  it('should render chevron icon in trigger', () => {
    expect(fixture.nativeElement.querySelector('.dropdown-chevron')).toBeTruthy();
  });

  it('should not show options by default', () => {
    expect(fixture.nativeElement.querySelector('.dropdown-options')).toBeNull();
  });

  it('should show options when trigger is clicked', () => {
    const trigger = fixture.nativeElement.querySelector('.dropdown-trigger') as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.dropdown-options')).toBeTruthy();
  });

  it('should render all options', () => {
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    const options = fixture.nativeElement.querySelectorAll('.dropdown-option');
    expect(options.length).toBe(3);
  });

  it('should display option labels', () => {
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    const options = fixture.nativeElement.querySelectorAll('.dropdown-option');
    expect(options[0].textContent).toContain('YouTube');
    expect(options[1].textContent).toContain('LinkedIn');
    expect(options[2].textContent).toContain('Twitter/X');
  });

  it('should highlight selected option with active class', () => {
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    const active = fixture.nativeElement.querySelector('.dropdown-option-active');
    expect(active).toBeTruthy();
    expect(active.textContent).toContain('YouTube');
  });

  it('should render checkmark on selected option only', () => {
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    const active = fixture.nativeElement.querySelector('.dropdown-option-active');
    expect(active.querySelector('.dropdown-check')).toBeTruthy();

    const inactive = fixture.nativeElement.querySelectorAll('.dropdown-option:not(.dropdown-option-active)');
    inactive.forEach((opt: Element) => {
      expect(opt.querySelector('.dropdown-check')).toBeNull();
    });
  });

  it('should emit valueChange when option is clicked', () => {
    const spy = vi.fn();
    fixture.componentInstance.valueChange.subscribe(spy);
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();

    const options = fixture.nativeElement.querySelectorAll('.dropdown-option');
    (options[1] as HTMLButtonElement).click();
    expect(spy).toHaveBeenCalledWith('linkedin');
  });

  it('should close dropdown after selecting an option', () => {
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();

    const options = fixture.nativeElement.querySelectorAll('.dropdown-option');
    (options[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.dropdown-options')).toBeNull();
  });

  it('should toggle dropdown open/closed on trigger click', () => {
    const trigger = fixture.nativeElement.querySelector('.dropdown-trigger') as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.open()).toBe(true);

    trigger.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.open()).toBe(false);
  });

  it('should set aria-expanded on trigger', () => {
    const trigger = fixture.nativeElement.querySelector('.dropdown-trigger');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
  });

  it('should set aria-selected on options', () => {
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    const options = fixture.nativeElement.querySelectorAll('.dropdown-option');
    expect(options[0].getAttribute('aria-selected')).toBe('true');
    expect(options[1].getAttribute('aria-selected')).toBe('false');
  });

  it('should have combobox role on trigger', () => {
    const trigger = fixture.nativeElement.querySelector('.dropdown-trigger');
    expect(trigger.getAttribute('role')).toBe('combobox');
  });

  it('should have listbox role on options container', () => {
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    const listbox = fixture.nativeElement.querySelector('.dropdown-options');
    expect(listbox.getAttribute('role')).toBe('listbox');
  });

  it('should display selected label when value changes', () => {
    fixture.componentRef.setInput('value', 'twitter');
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('.dropdown-trigger');
    expect(trigger.textContent).toContain('Twitter/X');
  });

  it('should display value as-is when no matching option label', () => {
    fixture.componentRef.setInput('value', 'unknown');
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('.dropdown-trigger');
    expect(trigger.textContent).toContain('unknown');
  });
});

describe('DropdownComponent (click outside)', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<DropdownComponent>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DropdownComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DropdownComponent);
    fixture.componentRef.setInput('options', OPTIONS);
    fixture.componentRef.setInput('value', 'youtube');
    fixture.detectChanges();
  });

  it('should close dropdown on outside click', () => {
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();

    document.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.open()).toBe(false);
  });
});
