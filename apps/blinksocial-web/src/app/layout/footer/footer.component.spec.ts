import { TestBed } from '@angular/core/testing';
import { FooterComponent } from './footer.component';

describe('FooterComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterComponent],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(FooterComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should display copyright text', () => {
    const fixture = TestBed.createComponent(FooterComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('2026 Blink Social');
    expect(el.textContent).toContain('All rights reserved');
  });

  it('should have a footer element', () => {
    const fixture = TestBed.createComponent(FooterComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('footer')).toBeTruthy();
  });
});
