import { TestBed } from '@angular/core/testing';
import { PlatformAdjustmentsComponent } from './platform-adjustments.component';

describe('PlatformAdjustmentsComponent', () => {
  let component: PlatformAdjustmentsComponent;
  let fixture: ReturnType<typeof TestBed.createComponent<PlatformAdjustmentsComponent>>;
  let nativeElement: HTMLElement;

  beforeEach(async () => {
    vi.useFakeTimers();
    await TestBed.configureTestingModule({
      imports: [PlatformAdjustmentsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PlatformAdjustmentsComponent);
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

  it('should render 5 platform cards', () => {
    expect(nativeElement.querySelectorAll('.platform-card').length).toBe(5);
  });

  it('should render 5 platform textareas', () => {
    expect(nativeElement.querySelectorAll('.platform-textarea').length).toBe(5);
  });

  it('should update platform adjustment', () => {
    component.updateAdjustment('instagram', 'Be warm and visual');
    const ig = component.adjustments().find(p => p.platform === 'instagram');
    expect(ig?.adjustment).toBe('Be warm and visual');
  });

  it('should suggest platform tone with AI', () => {
    component.suggestTone('instagram');
    expect(component.suggestingPlatform()).toBe('instagram');
    vi.advanceTimersByTime(1500);
    expect(component.suggestingPlatform()).toBeNull();
    const ig = component.adjustments().find(p => p.platform === 'instagram');
    expect(ig?.adjustment).toContain('Warm, visual storytelling');
  });

  it('should suggest for different platforms', () => {
    component.suggestTone('tiktok');
    vi.advanceTimersByTime(1500);
    expect(component.adjustments().find(p => p.platform === 'tiktok')?.adjustment).toContain('Fast-paced');

    component.suggestTone('youtube');
    vi.advanceTimersByTime(1500);
    expect(component.adjustments().find(p => p.platform === 'youtube')?.adjustment).toContain('Thorough');
  });

  it('should show spinner for suggested platform', () => {
    component.suggestTone('instagram');
    fixture.detectChanges();
    const cards = nativeElement.querySelectorAll('.platform-card');
    expect(cards[0].querySelector('.spinner')).toBeTruthy();
    expect(cards[0].textContent).toContain('Suggesting...');
    vi.advanceTimersByTime(1500);
  });

  it('should render platform labels', () => {
    expect(component.platformLabels['instagram']).toBe('Instagram');
    expect(component.platformLabels['tiktok']).toBe('TikTok');
    expect(component.platformLabels['youtube']).toBe('YouTube');
    expect(component.platformLabels['facebook']).toBe('Facebook');
    expect(component.platformLabels['linkedin']).toBe('LinkedIn');
  });

  it('should clean up timer on destroy', () => {
    component.suggestTone('instagram');
    fixture.destroy();
    vi.advanceTimersByTime(1500);
  });
});
