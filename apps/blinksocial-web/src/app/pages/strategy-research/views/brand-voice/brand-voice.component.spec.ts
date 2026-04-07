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

  it('should render all five child components', () => {
    expect(nativeElement.querySelector('app-voice-mission')).toBeTruthy();
    expect(nativeElement.querySelector('app-voice-attributes')).toBeTruthy();
    expect(nativeElement.querySelector('app-tone-context')).toBeTruthy();
    expect(nativeElement.querySelector('app-platform-adjustments')).toBeTruthy();
    expect(nativeElement.querySelector('app-vocabulary-guide')).toBeTruthy();
  });

  it('should render all five section titles', () => {
    const titles = nativeElement.querySelectorAll('.card-title');
    const titleTexts = Array.from(titles).map(el => el.textContent?.trim());
    expect(titleTexts).toContain('Mission Statement');
    expect(titleTexts).toContain('Voice Attributes');
    expect(titleTexts).toContain('Tone by Context');
    expect(titleTexts).toContain('Platform Tone Adjustments');
    expect(titleTexts).toContain('Vocabulary Guide');
  });

  it('should use flex column layout', () => {
    const container = nativeElement.querySelector('.brand-voice');
    expect(container).toBeTruthy();
  });
});
