import type {
  AudioMoodContract,
  AudioStrategyContract,
} from '@blinksocial/contracts';
import type { IconName } from '../../../../../../../../shared/icons/icons';
import type { CanonicalContentType } from '../../../draft-step/draft-canonical.utils';

/**
 * Canonical content types that surface the Audio Planning card. Anything
 * outside this set (images, carousels, text, links, long-form video,
 * documents, live) hides the card entirely.
 */
export const AUDIO_PLANNING_CANONICAL_TYPES: ReadonlyArray<CanonicalContentType> = [
  'VIDEO_SHORT_VERTICAL',
  'VIDEO_SHORT_HORIZONTAL',
  'STORY_FRAME_SET',
];

export interface StrategyOption {
  value: AudioStrategyContract;
  label: string;
  sublabel: string;
  iconName: IconName;
}

/**
 * #147: two-option toggle. Order + copy is verbatim from the PKG-1
 * spec — do not reorder or rewrite without re-confirming with product.
 * Icons follow the prototype's leading-glyph affordance (🎵/🔥) using
 * the centralized Lucide registry — `music` for Named, `flame` for
 * Trending/Platform.
 */
export const STRATEGY_OPTIONS: ReadonlyArray<StrategyOption> = [
  {
    value: 'named',
    label: 'Named Audio',
    sublabel: 'I have a specific song or original audio in mind',
    iconName: 'music',
  },
  {
    value: 'trending-platform',
    label: 'Trending/Platform Audio',
    sublabel: 'I want to ride an algorithmic trend to get more views',
    iconName: 'flame',
  },
];

export interface MoodOption {
  value: AudioMoodContract;
  label: string;
  description: string;
  iconName: IconName;
}

/**
 * #147: eight mood options. Labels + descriptions are verbatim from
 * the PKG-1 spec. Order is authoritative (matches the spec's listing).
 * Icons map 1:1 to the prototype's emojis via the centralized Lucide
 * registry — no emoji in the rendered DOM, the icons are SVG.
 */
export const MOOD_OPTIONS: ReadonlyArray<MoodOption> = [
  {
    value: 'energetic-pumped',
    label: 'Energetic / Pumped',
    description: 'High-intensity rhythm, fast tempo, heavy bass (EDM, rock)',
    iconName: 'zap',
  },
  {
    value: 'relaxing-calm',
    label: 'Relaxing / Calm',
    description: 'Slow tempos, gentle melodies, ambient sounds (Lofi hip hop)',
    iconName: 'leaf',
  },
  {
    value: 'happy-upbeat',
    label: 'Happy / Upbeat',
    description: 'Bright, major keys, fast-paced (Pop, summer hits)',
    iconName: 'sun',
  },
  {
    value: 'sad-melancholy',
    label: 'Sad / Melancholy',
    description: 'Slow, minor keys, poignant lyrics or vocals',
    iconName: 'cloud-rain',
  },
  {
    value: 'romantic-sensual',
    label: 'Romantic / Sensual',
    description: 'Smooth, slow, intimate, often jazz or ballads',
    iconName: 'heart',
  },
  {
    value: 'mysterious-mystical',
    label: 'Mysterious / Mystical',
    description: 'Atmospheric, unconventional, often ambient',
    iconName: 'moon',
  },
  {
    value: 'scary-spooky-suspense',
    label: 'Scary / Spooky / Suspense',
    description: 'Tense, dissonant, unpredictable sounds',
    iconName: 'ghost',
  },
  {
    value: 'confident-motivational',
    label: 'Confident / Motivational',
    description: 'Powerful, driving beats',
    iconName: 'target',
  },
];

export const AUDIO_TOOLTIP =
  "Plan which audio to use during video editing. This is a production reference — select your track in the platform's native app when you post. Your video editor applies the audio before export if embedding in the file.";
