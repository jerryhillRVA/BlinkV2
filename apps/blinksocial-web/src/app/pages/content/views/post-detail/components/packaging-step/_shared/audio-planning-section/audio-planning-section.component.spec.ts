import { ComponentFixture, TestBed } from '@angular/core/testing';
import type {
  ContentTypeContract,
  PackagingAudioPlanningContract,
  PlatformContract,
} from '@blinksocial/contracts';
import { AudioPlanningSectionComponent } from './audio-planning-section.component';
import { MOOD_OPTIONS } from './audio-planning.constants';

interface SetupInputs {
  value?: PackagingAudioPlanningContract;
  platform?: PlatformContract;
  contentType?: ContentTypeContract | null;
  disabled?: boolean;
}

function setup(
  inputs: SetupInputs = {},
): ComponentFixture<AudioPlanningSectionComponent> {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ imports: [AudioPlanningSectionComponent] });
  const fixture = TestBed.createComponent(AudioPlanningSectionComponent);
  if (inputs.value !== undefined) {
    fixture.componentRef.setInput('value', inputs.value);
  }
  fixture.componentRef.setInput('platform', inputs.platform ?? 'instagram');
  fixture.componentRef.setInput(
    'contentType',
    inputs.contentType === undefined ? 'reel' : inputs.contentType,
  );
  if (inputs.disabled !== undefined) {
    fixture.componentRef.setInput('disabled', inputs.disabled);
  }
  fixture.detectChanges();
  return fixture;
}

describe('AudioPlanningSectionComponent', () => {
  it('renders for IG reel (VIDEO_SHORT_VERTICAL)', () => {
    const fixture = setup({ platform: 'instagram', contentType: 'reel' });
    expect(fixture.nativeElement.querySelector('.audio-planning-section')).not.toBeNull();
  });

  it('renders for IG story (STORY_FRAME_SET)', () => {
    const fixture = setup({ platform: 'instagram', contentType: 'story' });
    expect(fixture.nativeElement.querySelector('.audio-planning-section')).not.toBeNull();
  });

  it('renders for TikTok short-video (VIDEO_SHORT_VERTICAL)', () => {
    const fixture = setup({ platform: 'tiktok', contentType: 'short-video' });
    expect(fixture.nativeElement.querySelector('.audio-planning-section')).not.toBeNull();
  });

  it('renders for Facebook fb-reel (VIDEO_SHORT_VERTICAL)', () => {
    const fixture = setup({ platform: 'facebook', contentType: 'fb-reel' });
    expect(fixture.nativeElement.querySelector('.audio-planning-section')).not.toBeNull();
  });

  it('renders for Facebook fb-story (STORY_FRAME_SET)', () => {
    const fixture = setup({ platform: 'facebook', contentType: 'fb-story' });
    expect(fixture.nativeElement.querySelector('.audio-planning-section')).not.toBeNull();
  });

  it('hidden for IG feed-post (IMAGE_SINGLE)', () => {
    const fixture = setup({ platform: 'instagram', contentType: 'feed-post' });
    expect(fixture.nativeElement.querySelector('.audio-planning-section')).toBeNull();
  });

  it('hidden for IG carousel (IMAGE_CAROUSEL)', () => {
    const fixture = setup({ platform: 'instagram', contentType: 'carousel' });
    expect(fixture.nativeElement.querySelector('.audio-planning-section')).toBeNull();
  });

  it('hidden for X tweet (TEXT_POST)', () => {
    const fixture = setup({ platform: 'x', contentType: 'tweet' });
    expect(fixture.nativeElement.querySelector('.audio-planning-section')).toBeNull();
  });

  it('hidden when contentType is null', () => {
    const fixture = setup({ platform: 'instagram', contentType: null });
    expect(fixture.nativeElement.querySelector('.audio-planning-section')).toBeNull();
  });

  it('defaults strategy to Named Audio with aria-checked="true" when value is undefined', () => {
    const fixture = setup();
    const options = fixture.nativeElement.querySelectorAll('.segmented-option');
    expect(options.length).toBe(2);
    expect((options[0] as HTMLElement).getAttribute('aria-checked')).toBe('true');
    expect((options[1] as HTMLElement).getAttribute('aria-checked')).toBe('false');
  });

  it('mood region is HIDDEN under Named Audio', () => {
    const fixture = setup();
    expect(fixture.nativeElement.querySelector('.mood-region')).toBeNull();
  });

  it('mood region is VISIBLE under Trending/Platform Audio', () => {
    const fixture = setup({ value: { audioStrategy: 'trending-platform' } });
    const region = fixture.nativeElement.querySelector('.mood-region');
    expect(region).not.toBeNull();
    expect(region?.getAttribute('role')).toBe('region');
    expect(region?.getAttribute('aria-live')).toBe('polite');
  });

  it('selecting Trending/Platform emits valueChange with audioStrategy', () => {
    const fixture = setup();
    const emitted: PackagingAudioPlanningContract[] = [];
    fixture.componentInstance.valueChange.subscribe((v) => emitted.push(v));
    const options = fixture.nativeElement.querySelectorAll('.segmented-option');
    (options[1] as HTMLButtonElement).click();
    expect(emitted).toEqual([{ audioStrategy: 'trending-platform' }]);
  });

  it('selecting Named after a mood was picked clears the mood in the same emit', () => {
    const fixture = setup({
      value: { audioStrategy: 'trending-platform', audioMood: 'energetic-pumped' },
    });
    const emitted: PackagingAudioPlanningContract[] = [];
    fixture.componentInstance.valueChange.subscribe((v) => emitted.push(v));
    const options = fixture.nativeElement.querySelectorAll('.segmented-option');
    (options[0] as HTMLButtonElement).click();
    expect(emitted).toEqual([
      {
        audioStrategy: 'named',
        audioMood: undefined,
      },
    ]);
  });

  it('clicking the already-selected option is a no-op', () => {
    const fixture = setup({ value: { audioStrategy: 'named' } });
    const emitted: PackagingAudioPlanningContract[] = [];
    fixture.componentInstance.valueChange.subscribe((v) => emitted.push(v));
    const options = fixture.nativeElement.querySelectorAll('.segmented-option');
    (options[0] as HTMLButtonElement).click();
    expect(emitted).toEqual([]);
  });

  it('arrow keys flip the toggle selection', () => {
    const fixture = setup({ value: { audioStrategy: 'named' } });
    const emitted: PackagingAudioPlanningContract[] = [];
    fixture.componentInstance.valueChange.subscribe((v) => emitted.push(v));
    const namedOption = fixture.nativeElement.querySelectorAll('.segmented-option')[0] as HTMLButtonElement;
    const evt = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true });
    namedOption.dispatchEvent(evt);
    expect(emitted).toEqual([{ audioStrategy: 'trending-platform' }]);
  });

  it('ArrowLeft wraps to last option from first', () => {
    const fixture = setup({ value: { audioStrategy: 'named' } });
    const emitted: PackagingAudioPlanningContract[] = [];
    fixture.componentInstance.valueChange.subscribe((v) => emitted.push(v));
    const namedOption = fixture.nativeElement.querySelectorAll('.segmented-option')[0] as HTMLButtonElement;
    namedOption.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(emitted).toEqual([{ audioStrategy: 'trending-platform' }]);
  });

  it('non-arrow keydown is ignored', () => {
    const fixture = setup({ value: { audioStrategy: 'named' } });
    const emitted: PackagingAudioPlanningContract[] = [];
    fixture.componentInstance.valueChange.subscribe((v) => emitted.push(v));
    const namedOption = fixture.nativeElement.querySelectorAll('.segmented-option')[0] as HTMLButtonElement;
    namedOption.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    expect(emitted).toEqual([]);
  });

  it('strategy toggle group has role="radiogroup"; options have role="radio"', () => {
    const fixture = setup();
    const group = fixture.nativeElement.querySelector('.segmented-toggle');
    expect(group?.getAttribute('role')).toBe('radiogroup');
    const options = fixture.nativeElement.querySelectorAll('.segmented-option');
    expect((options[0] as HTMLElement).getAttribute('role')).toBe('radio');
    expect((options[1] as HTMLElement).getAttribute('role')).toBe('radio');
  });

  it('mood select renders 8 MOOD_OPTIONS in order, no emoji', () => {
    const fixture = setup({ value: { audioStrategy: 'trending-platform' } });
    const select = fixture.nativeElement.querySelector('select.mood-select') as HTMLSelectElement;
    expect(select).not.toBeNull();
    const options = Array.from(select.querySelectorAll('option'));
    // First is the placeholder "Select a mood..." with empty value.
    expect(options[0].value).toBe('');
    expect(options[0].textContent?.trim()).toBe('Select a mood...');
    const moodOptions = options.slice(1);
    expect(moodOptions.length).toBe(8);
    const emojiRe = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
    moodOptions.forEach((el, i) => {
      const text = (el as HTMLOptionElement).textContent?.trim() ?? '';
      expect(text).toContain(MOOD_OPTIONS[i].label);
      expect(text).toContain(MOOD_OPTIONS[i].description);
      expect(emojiRe.test(text)).toBe(false);
    });
  });

  it('label and helper text appear and are wired via for/id', () => {
    const fixture = setup({ value: { audioStrategy: 'trending-platform' } });
    const label = fixture.nativeElement.querySelector(
      'label[for="audio-mood-trigger"]',
    ) as HTMLLabelElement;
    expect(label.textContent?.trim()).toContain('Video Vibe & Pace');
    const help = fixture.nativeElement.querySelector('#audio-mood-help');
    expect(help?.textContent?.trim()).toBe('What is the emotional energy of your video?');
    const select = fixture.nativeElement.querySelector(
      'select.mood-select',
    ) as HTMLSelectElement;
    expect(select.getAttribute('aria-describedby')).toBe('audio-mood-help');
  });

  it('selecting a mood emits valueChange with audioMood id and strategy preserved', () => {
    const fixture = setup({ value: { audioStrategy: 'trending-platform' } });
    const emitted: PackagingAudioPlanningContract[] = [];
    fixture.componentInstance.valueChange.subscribe((v) => emitted.push(v));
    const select = fixture.nativeElement.querySelector(
      'select.mood-select',
    ) as HTMLSelectElement;
    select.value = 'happy-upbeat';
    select.dispatchEvent(new Event('change'));
    expect(emitted).toEqual([
      {
        audioStrategy: 'trending-platform',
        audioMood: 'happy-upbeat',
      },
    ]);
  });

  it('disabled state prevents strategy clicks from emitting', () => {
    const fixture = setup({ disabled: true });
    const emitted: PackagingAudioPlanningContract[] = [];
    fixture.componentInstance.valueChange.subscribe((v) => emitted.push(v));
    const options = fixture.nativeElement.querySelectorAll('.segmented-option');
    (options[1] as HTMLButtonElement).click();
    expect(emitted).toEqual([]);
  });

  it('disabled state prevents mood change from emitting', () => {
    const fixture = setup({
      value: { audioStrategy: 'trending-platform' },
      disabled: true,
    });
    const emitted: PackagingAudioPlanningContract[] = [];
    fixture.componentInstance.valueChange.subscribe((v) => emitted.push(v));
    const select = fixture.nativeElement.querySelector(
      'select.mood-select',
    ) as HTMLSelectElement;
    expect(select.disabled).toBe(true);
    select.value = 'happy-upbeat';
    select.dispatchEvent(new Event('change'));
    expect(emitted).toEqual([]);
  });

  it('selected strategy option carries the --selected class', () => {
    const fixture = setup({ value: { audioStrategy: 'trending-platform' } });
    const options = fixture.nativeElement.querySelectorAll('.segmented-option');
    expect((options[1] as HTMLElement).classList.contains('segmented-option--selected')).toBe(true);
    expect((options[0] as HTMLElement).classList.contains('segmented-option--selected')).toBe(false);
  });
});
