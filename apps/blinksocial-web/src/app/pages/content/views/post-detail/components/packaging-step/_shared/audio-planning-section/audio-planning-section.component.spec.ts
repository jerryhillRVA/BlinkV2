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

  it('mood dropdown renders 8 MOOD_OPTIONS in order, no emoji, each carries an icon', () => {
    const fixture = setup({ value: { audioStrategy: 'trending-platform' } });
    // Open the dropdown so the option list mounts.
    const trigger = fixture.nativeElement.querySelector(
      'app-dropdown .dropdown-trigger',
    ) as HTMLButtonElement;
    expect(trigger).not.toBeNull();
    trigger.click();
    fixture.detectChanges();
    const options = Array.from(
      fixture.nativeElement.querySelectorAll('app-dropdown .dropdown-option'),
    );
    expect(options.length).toBe(8);
    const emojiRe = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
    options.forEach((el, i) => {
      const text = (el as HTMLElement).textContent?.trim() ?? '';
      expect(text).toContain(MOOD_OPTIONS[i].label);
      expect(text).toContain(MOOD_OPTIONS[i].description);
      expect(emojiRe.test(text)).toBe(false);
      // Every option renders an SVG icon from the registry.
      expect((el as HTMLElement).querySelector('app-icon svg')).not.toBeNull();
    });
  });

  it('label, helper text, and placeholder appear in the mood region', () => {
    const fixture = setup({ value: { audioStrategy: 'trending-platform' } });
    const label = fixture.nativeElement.querySelector('#audio-mood-label');
    expect(label?.textContent?.trim()).toContain('Video Vibe & Pace');
    const help = fixture.nativeElement.querySelector('#audio-mood-help');
    expect(help?.textContent?.trim()).toBe('What is the emotional energy of your video?');
    // Placeholder text comes through the dropdown trigger.
    const valueLabel = fixture.nativeElement.querySelector(
      'app-dropdown .dropdown-value',
    ) as HTMLElement;
    expect(valueLabel.textContent?.trim()).toContain('Select a mood');
  });

  it('selecting a mood emits valueChange with audioMood id and strategy preserved', () => {
    const fixture = setup({ value: { audioStrategy: 'trending-platform' } });
    const emitted: PackagingAudioPlanningContract[] = [];
    fixture.componentInstance.valueChange.subscribe((v) => emitted.push(v));
    (fixture.nativeElement.querySelector(
      'app-dropdown .dropdown-trigger',
    ) as HTMLButtonElement).click();
    fixture.detectChanges();
    // Click the third option (happy-upbeat).
    const happy = Array.from(
      fixture.nativeElement.querySelectorAll('app-dropdown .dropdown-option'),
    )[2] as HTMLButtonElement;
    happy.click();
    expect(emitted).toEqual([
      {
        audioStrategy: 'trending-platform',
        audioMood: 'happy-upbeat',
      },
    ]);
  });

  it('clearing the mood (falsy emit from dropdown) drops audioMood while keeping strategy', () => {
    const fixture = setup({
      value: { audioStrategy: 'trending-platform', audioMood: 'happy-upbeat' },
    });
    const emitted: PackagingAudioPlanningContract[] = [];
    fixture.componentInstance.valueChange.subscribe((v) => emitted.push(v));
    // The dropdown itself never echoes the placeholder back, but the
    // handler defensively normalizes an empty emit to `audioMood:
    // undefined`. Exercise that branch directly so it's covered.
    fixture.componentInstance['onMoodSelect']('');
    expect(emitted).toEqual([
      { audioStrategy: 'trending-platform', audioMood: undefined },
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
    // Direct handler invocation bypasses the dropdown's open/close UX so
    // this stays a pure unit test of the disabled-gate.
    fixture.componentInstance['onMoodSelect']('happy-upbeat');
    expect(emitted).toEqual([]);
  });

  it('strategy buttons render their registry icons (music + flame)', () => {
    const fixture = setup();
    const buttons = fixture.nativeElement.querySelectorAll('.segmented-option');
    // app-icon renders an inline <svg>, so finding one inside each
    // strategy button is enough to confirm the icon mounted.
    expect(buttons[0].querySelector('.segmented-option-icon svg')).not.toBeNull();
    expect(buttons[1].querySelector('.segmented-option-icon svg')).not.toBeNull();
  });

  it('selected strategy option carries the --selected class', () => {
    const fixture = setup({ value: { audioStrategy: 'trending-platform' } });
    const options = fixture.nativeElement.querySelectorAll('.segmented-option');
    expect((options[1] as HTMLElement).classList.contains('segmented-option--selected')).toBe(true);
    expect((options[0] as HTMLElement).classList.contains('segmented-option--selected')).toBe(false);
  });
});
