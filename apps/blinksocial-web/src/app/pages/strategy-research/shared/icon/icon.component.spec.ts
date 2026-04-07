import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IconComponent, IconName } from './icon.component';

describe('IconComponent', () => {
  let fixture: ComponentFixture<IconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IconComponent],
    }).compileComponents();
  });

  function createComponent(name: IconName, size?: number): ComponentFixture<IconComponent> {
    fixture = TestBed.createComponent(IconComponent);
    fixture.componentRef.setInput('name', name);
    if (size !== undefined) {
      fixture.componentRef.setInput('size', size);
    }
    fixture.detectChanges();
    return fixture;
  }

  it('should render an SVG element', () => {
    createComponent('edit');
    const svg = fixture.nativeElement.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('should set default size to 16', () => {
    createComponent('edit');
    const svg = fixture.nativeElement.querySelector('svg');
    expect(svg.getAttribute('width')).toBe('16');
    expect(svg.getAttribute('height')).toBe('16');
  });

  it('should accept custom size', () => {
    createComponent('plus', 24);
    const svg = fixture.nativeElement.querySelector('svg');
    expect(svg.getAttribute('width')).toBe('24');
    expect(svg.getAttribute('height')).toBe('24');
  });

  it('should render path content for each icon name', () => {
    const icons: IconName[] = ['edit', 'trash', 'plus', 'close', 'sparkles', 'sparkle', 'spinner', 'target', 'microphone', 'message', 'chevron-down', 'chevron-up', 'check', 'book', 'broadcast', 'search'];
    for (const icon of icons) {
      createComponent(icon);
      const svg = fixture.nativeElement.querySelector('svg');
      const hasContent = svg.querySelector('path, line, circle, polyline, polygon');
      expect(hasContent).toBeTruthy();
    }
  });
});
