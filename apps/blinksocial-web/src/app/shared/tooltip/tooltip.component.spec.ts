import { TestBed } from '@angular/core/testing';
import { TooltipComponent } from './tooltip.component';
import { TooltipService } from './tooltip.service';

describe('TooltipComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<TooltipComponent>>;
  let tooltipService: TooltipService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TooltipComponent],
    }).compileComponents();

    tooltipService = TestBed.inject(TooltipService);
    fixture = TestBed.createComponent(TooltipComponent);
    fixture.componentRef.setInput('text', 'Help text here');
    fixture.detectChanges();
  });

  afterEach(() => {
    tooltipService.hide();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render tooltip trigger button', () => {
    const btn = fixture.nativeElement.querySelector('.tooltip-trigger');
    expect(btn).toBeTruthy();
  });

  it('should call TooltipService.show on mouseenter', () => {
    const spy = vi.spyOn(tooltipService, 'show');
    const btn = fixture.nativeElement.querySelector('.tooltip-trigger') as HTMLElement;
    btn.dispatchEvent(new MouseEvent('mouseenter'));
    expect(spy).toHaveBeenCalledWith(btn, 'Help text here');
  });

  it('should call TooltipService.hide on mouseleave', () => {
    const spy = vi.spyOn(tooltipService, 'hide');
    const btn = fixture.nativeElement.querySelector('.tooltip-trigger') as HTMLElement;
    btn.dispatchEvent(new MouseEvent('mouseleave'));
    expect(spy).toHaveBeenCalled();
  });

  it('should call TooltipService.show on focus', () => {
    const spy = vi.spyOn(tooltipService, 'show');
    const btn = fixture.nativeElement.querySelector('.tooltip-trigger') as HTMLElement;
    btn.dispatchEvent(new FocusEvent('focus'));
    expect(spy).toHaveBeenCalled();
  });

  it('should call TooltipService.hide on blur', () => {
    const spy = vi.spyOn(tooltipService, 'hide');
    const btn = fixture.nativeElement.querySelector('.tooltip-trigger') as HTMLElement;
    btn.dispatchEvent(new FocusEvent('blur'));
    expect(spy).toHaveBeenCalled();
  });

  it('should render info icon SVG by default', () => {
    const svg = fixture.nativeElement.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('should have aria-label for accessibility', () => {
    const btn = fixture.nativeElement.querySelector('.tooltip-trigger');
    expect(btn.getAttribute('aria-label')).toBe('More information');
  });

  it('should default to info icon type', () => {
    expect(fixture.componentInstance.type()).toBe('info');
  });

  it('should render help icon when type is help', () => {
    fixture.componentRef.setInput('type', 'help');
    fixture.detectChanges();
    const svg = fixture.nativeElement.querySelector('svg');
    expect(svg.innerHTML).toContain('M9.09');
  });

  it('should render warning icon when type is warning', () => {
    fixture.componentRef.setInput('type', 'warning');
    fixture.detectChanges();
    const svg = fixture.nativeElement.querySelector('svg');
    expect(svg.innerHTML).toContain('m21.73');
  });
});

describe('TooltipService', () => {
  let service: TooltipService;

  beforeEach(() => {
    // Clean up any existing tooltip element from prior tests
    document.querySelectorAll('.blink-tooltip-popup').forEach((el) => el.remove());
    // Create a fresh service instance so it creates a new element
    service = new TooltipService();
  });

  afterEach(() => {
    service.hide();
    document.querySelectorAll('.blink-tooltip-popup').forEach((el) => el.remove());
  });

  it('should create a global tooltip element on first show', () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    service.show(trigger, 'Test tooltip');
    const popup = document.querySelector('.blink-tooltip-popup');
    expect(popup).toBeTruthy();
    expect(popup?.textContent).toBe('Test tooltip');
    trigger.remove();
  });

  it('should hide the tooltip', () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    service.show(trigger, 'Test');
    service.hide();
    const popup = document.querySelector('.blink-tooltip-popup') as HTMLElement;
    expect(popup?.style.display).toBe('none');
    trigger.remove();
  });

  it('should reuse the same element on multiple shows', () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    service.show(trigger, 'First');
    service.show(trigger, 'Second');
    const popups = document.querySelectorAll('.blink-tooltip-popup');
    expect(popups.length).toBe(1);
    expect(popups[0].textContent).toBe('Second');
    trigger.remove();
  });
});
