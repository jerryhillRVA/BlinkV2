import { TestBed } from '@angular/core/testing';
import { BrandVoiceComponent } from './brand-voice.component';

describe('BrandVoiceComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<BrandVoiceComponent>>;
  let nativeElement: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BrandVoiceComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BrandVoiceComponent);
    fixture.detectChanges();
    nativeElement = fixture.nativeElement;
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render all three child components', () => {
    expect(nativeElement.querySelector('app-voice-mission')).toBeTruthy();
    expect(nativeElement.querySelector('app-voice-attributes')).toBeTruthy();
    expect(nativeElement.querySelector('app-vocabulary-guide')).toBeTruthy();
  });

  it('should render the section labels', () => {
    const labels = nativeElement.querySelectorAll('.bv-section-label');
    const labelTexts = Array.from(labels).map(el => el.textContent?.trim());
    expect(labelTexts).toContain('Content Mission Statement');
    expect(labelTexts).toContain('Brand Personality');
    expect(labelTexts).toContain('Vocabulary Guide');
  });

  it('should render page header with title and subtitle', () => {
    const header = nativeElement.querySelector('.page-header');
    expect(header).toBeTruthy();
    expect(nativeElement.querySelector('.page-header-title')?.textContent).toContain('Brand Voice');
    expect(nativeElement.querySelector('.page-header-subtitle')?.textContent).toContain('Define how your brand');
  });

  it('should use flex column layout', () => {
    const container = nativeElement.querySelector('.brand-voice');
    expect(container).toBeTruthy();
  });
});
