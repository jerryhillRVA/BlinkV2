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

describe('DropdownComponent (icon support)', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<DropdownComponent>>;

  const ICON_OPTIONS = [
    {
      value: 'idea',
      label: 'Idea',
      iconPaths: ['M1 1h2'],
      iconColor: '#3b82f6',
    },
    {
      value: 'concept',
      label: 'Concept',
      iconPaths: ['M4 4h4'],
      iconColor: '#a855f7',
    },
    { value: 'plain', label: 'Plain' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DropdownComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DropdownComponent);
    fixture.componentRef.setInput('options', ICON_OPTIONS);
    fixture.componentRef.setInput('value', 'idea');
    fixture.detectChanges();
  });

  it('renders the selected option icon in the trigger', () => {
    const triggerIcon = fixture.nativeElement.querySelector(
      '.dropdown-trigger .dropdown-option-icon',
    );
    expect(triggerIcon).toBeTruthy();
    // svg path should match the first pathD of the selected option
    const path = triggerIcon.querySelector('path');
    expect(path?.getAttribute('d')).toBe('M1 1h2');
  });

  it('applies iconColor to the trigger icon', () => {
    const triggerIcon: HTMLElement = fixture.nativeElement.querySelector(
      '.dropdown-trigger .dropdown-option-icon',
    );
    expect(triggerIcon.getAttribute('style')).toContain('color: rgb(59, 130, 246)');
  });

  it('renders an icon in each option row that has iconPaths', () => {
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    const options = fixture.nativeElement.querySelectorAll('.dropdown-option');
    expect(options[0].querySelector('.dropdown-option-icon')).toBeTruthy();
    expect(options[1].querySelector('.dropdown-option-icon')).toBeTruthy();
    // the 'plain' option has no iconPaths
    expect(options[2].querySelector('.dropdown-option-icon')).toBeNull();
  });

  it('does NOT render trigger icon when selected option has no iconPaths', () => {
    fixture.componentRef.setInput('value', 'plain');
    fixture.detectChanges();
    const triggerIcon = fixture.nativeElement.querySelector(
      '.dropdown-trigger .dropdown-option-icon',
    );
    expect(triggerIcon).toBeNull();
  });

  it('falls back to null iconColor when selected option has iconPaths but no iconColor', () => {
    fixture.componentRef.setInput('options', [
      { value: 'mono', label: 'Mono', iconPaths: ['M0 0h1'] },
    ]);
    fixture.componentRef.setInput('value', 'mono');
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedIconPaths()).toEqual(['M0 0h1']);
    expect(fixture.componentInstance.selectedIconColor()).toBeNull();
  });

  it('both selectedIconPaths and selectedIconColor return null when option has neither', () => {
    fixture.componentRef.setInput('options', [{ value: 'a', label: 'A' }]);
    fixture.componentRef.setInput('value', 'a');
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedIconPaths()).toBeNull();
    expect(fixture.componentInstance.selectedIconColor()).toBeNull();
  });
});

describe('DropdownComponent (platform icon)', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<DropdownComponent>>;

  const PLATFORM_OPTIONS = [
    { value: 'instagram', label: 'Instagram', platformIcon: 'instagram' as const },
    { value: 'tiktok', label: 'TikTok', platformIcon: 'tiktok' as const },
    { value: 'plain', label: 'Plain' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DropdownComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(DropdownComponent);
    fixture.componentRef.setInput('options', PLATFORM_OPTIONS);
    fixture.componentRef.setInput('value', 'instagram');
    fixture.detectChanges();
  });

  it('renders an <app-platform-icon> in the trigger when the selected option has platformIcon', () => {
    const trigger = fixture.nativeElement.querySelector('.dropdown-trigger');
    const icon = trigger.querySelector('.dropdown-platform-icon');
    expect(icon).toBeTruthy();
    expect(icon.getAttribute('data-platform')).toBe('instagram');
    expect(icon.querySelector('app-platform-icon')).not.toBeNull();
  });

  it('renders platform icons in each option row that has platformIcon', () => {
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    const options = fixture.nativeElement.querySelectorAll('.dropdown-option');
    expect(options[0].querySelector('.dropdown-platform-icon')).toBeTruthy();
    expect(options[1].querySelector('.dropdown-platform-icon')).toBeTruthy();
    // 'plain' has no platformIcon
    expect(options[2].querySelector('.dropdown-platform-icon')).toBeNull();
  });

  it('does not render trigger platform icon when the selected option has no platformIcon', () => {
    fixture.componentRef.setInput('value', 'plain');
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('.dropdown-trigger .dropdown-platform-icon'),
    ).toBeNull();
  });
});

describe('DropdownComponent (compact size)', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<DropdownComponent>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DropdownComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DropdownComponent);
    fixture.componentRef.setInput('options', OPTIONS);
    fixture.componentRef.setInput('value', 'youtube');
    fixture.componentRef.setInput('size', 'compact');
    fixture.detectChanges();
  });

  it('should apply compact class to wrapper', () => {
    const wrapper = fixture.nativeElement.querySelector('.dropdown-wrapper');
    expect(wrapper.classList.contains('dropdown-compact')).toBe(true);
  });

  it('should still render trigger with selected label', () => {
    const trigger = fixture.nativeElement.querySelector('.dropdown-trigger');
    expect(trigger.textContent).toContain('YouTube');
  });

  it('should not apply compact class when size is default', () => {
    fixture.componentRef.setInput('size', 'default');
    fixture.detectChanges();
    const wrapper = fixture.nativeElement.querySelector('.dropdown-wrapper');
    expect(wrapper.classList.contains('dropdown-compact')).toBe(false);
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

describe('DropdownComponent (placeholder + colour + flag inputs)', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<DropdownComponent>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DropdownComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(DropdownComponent);
    fixture.componentRef.setInput('options', [
      { value: 'red', label: 'Red', color: '#f00' },
      { value: 'blue', label: 'Blue' },
    ]);
  });

  it('renders the placeholder when value is empty and reports isPlaceholder()', () => {
    fixture.componentRef.setInput('value', '');
    fixture.componentRef.setInput('placeholder', 'Pick a colour');
    fixture.detectChanges();
    expect(fixture.componentInstance.isPlaceholder()).toBe(true);
    expect(fixture.componentInstance.selectedLabel()).toBe('Pick a colour');
    const trigger = fixture.nativeElement.querySelector('.dropdown-trigger');
    expect(trigger.textContent).toContain('Pick a colour');
    expect(
      fixture.nativeElement.querySelector('.dropdown-value--placeholder'),
    ).toBeTruthy();
  });

  it('renders the colour swatch in the trigger when the selected option has a colour', () => {
    fixture.componentRef.setInput('value', 'red');
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedColor()).toBe('#f00');
    const dot = fixture.nativeElement.querySelector(
      '.dropdown-trigger .dropdown-color-dot',
    );
    expect(dot).toBeTruthy();
  });

  it('returns null selectedColor when the selected option lacks a colour', () => {
    fixture.componentRef.setInput('value', 'blue');
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedColor()).toBeNull();
    expect(
      fixture.nativeElement.querySelector('.dropdown-trigger .dropdown-color-dot'),
    ).toBeNull();
  });

  it('applies the dropdown-full host class when fullWidth is true', () => {
    fixture.componentRef.setInput('value', 'red');
    fixture.componentRef.setInput('fullWidth', true);
    fixture.detectChanges();
    expect(fixture.componentInstance.hostFull).toBe(true);
    expect(
      (fixture.nativeElement as HTMLElement).classList.contains('dropdown-host-full'),
    ).toBe(true);
  });

  it('applies the dropdown-filled wrapper class when filled is true', () => {
    fixture.componentRef.setInput('value', 'red');
    fixture.componentRef.setInput('filled', true);
    fixture.detectChanges();
    const wrapper = fixture.nativeElement.querySelector('.dropdown-wrapper');
    expect(wrapper.classList.contains('dropdown-filled')).toBe(true);
  });

  it('applies the dropdown-sm wrapper class when size is "sm"', () => {
    fixture.componentRef.setInput('value', 'red');
    fixture.componentRef.setInput('size', 'sm');
    fixture.detectChanges();
    const wrapper = fixture.nativeElement.querySelector('.dropdown-wrapper');
    expect(wrapper.classList.contains('dropdown-sm')).toBe(true);
  });
});
