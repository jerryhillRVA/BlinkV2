import type {
  AudioMoodContract,
  AudioStrategyContract,
} from '@blinksocial/contracts';
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
}

/**
 * #147: two-option toggle. Order + copy is verbatim from the PKG-1
 * spec — do not reorder or rewrite without re-confirming with product.
 */
export const STRATEGY_OPTIONS: ReadonlyArray<StrategyOption> = [
  {
    value: 'named',
    label: 'Named Audio',
    sublabel: 'I have a specific song or original audio in mind',
  },
  {
    value: 'trending-platform',
    label: 'Trending/Platform Audio',
    sublabel: 'I want to ride an algorithmic trend to get more views',
  },
];

export interface MoodOption {
  value: AudioMoodContract;
  label: string;
  description: string;
}

/**
 * #147: eight mood options. **No emoji / leading icons** — the spec
 * is explicit on this. Labels + descriptions are verbatim. Order is
 * authoritative (matches the spec's listing).
 */
export const MOOD_OPTIONS: ReadonlyArray<MoodOption> = [
  {
    value: 'energetic-pumped',
    label: 'Energetic / Pumped',
    description: 'High-intensity rhythm, fast tempo, heavy bass (EDM, rock)',
  },
  {
    value: 'relaxing-calm',
    label: 'Relaxing / Calm',
    description: 'Slow tempos, gentle melodies, ambient sounds (Lofi hip hop)',
  },
  {
    value: 'happy-upbeat',
    label: 'Happy / Upbeat',
    description: 'Bright, major keys, fast-paced (Pop, summer hits)',
  },
  {
    value: 'sad-melancholy',
    label: 'Sad / Melancholy',
    description: 'Slow, minor keys, poignant lyrics or vocals',
  },
  {
    value: 'romantic-sensual',
    label: 'Romantic / Sensual',
    description: 'Smooth, slow, intimate, often jazz or ballads',
  },
  {
    value: 'mysterious-mystical',
    label: 'Mysterious / Mystical',
    description: 'Atmospheric, unconventional, often ambient',
  },
  {
    value: 'scary-spooky-suspense',
    label: 'Scary / Spooky / Suspense',
    description: 'Tense, dissonant, unpredictable sounds',
  },
  {
    value: 'confident-motivational',
    label: 'Confident / Motivational',
    description: 'Powerful, driving beats',
  },
];

export const AUDIO_TOOLTIP =
  "Plan which audio to use during video editing. This is a production reference — select your track in the platform's native app when you post. Your video editor applies the audio before export if embedding in the file.";
