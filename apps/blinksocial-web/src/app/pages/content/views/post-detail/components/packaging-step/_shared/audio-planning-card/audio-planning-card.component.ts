import { Component, computed, input, output } from '@angular/core';
import type {
  AudioMoodContract,
  AudioStrategyContract,
  ContentTypeContract,
  PackagingAudioPlanningContract,
  PlatformContract,
} from '@blinksocial/contracts';
import {
  DropdownComponent,
  type DropdownOption,
} from '../../../../../../../../shared/dropdown/dropdown.component';
import { SectionLabelComponent } from '../../../draft-step/_shared/section-label/section-label.component';
import { getCanonicalType } from '../../../draft-step/draft-canonical.utils';
import {
  AUDIO_PLANNING_CANONICAL_TYPES,
  AUDIO_TOOLTIP,
  MOOD_OPTIONS,
  STRATEGY_OPTIONS,
} from './audio-planning.constants';

/**
 * #147 (PKG-1): Audio Planning card.
 *
 * Replaces the prior "Browse Trending Sounds / Use Original" UI. Two
 * fields:
 *   1. Strategy Mode toggle — Named Audio (default) vs Trending/Platform.
 *   2. Video Vibe & Pace mood dropdown — only renders when strategy is
 *      Trending/Platform Audio; cleared when the user flips back.
 *
 * The card renders only for canonical content types in
 * `AUDIO_PLANNING_CANONICAL_TYPES` (VIDEO_SHORT_VERTICAL,
 * VIDEO_SHORT_HORIZONTAL, STORY_FRAME_SET). The parent doesn't need to
 * gate — the card hides itself when ineligible.
 */
@Component({
  selector: 'app-audio-planning-card',
  imports: [DropdownComponent, SectionLabelComponent],
  templateUrl: './audio-planning-card.component.html',
  styleUrl: './audio-planning-card.component.scss',
})
export class AudioPlanningCardComponent {
  /* v8 ignore next 4 — V8's function-call-throws branches on input() declarations are unreachable (Angular class-field init time; ESM exports not spy-able) */
  readonly value = input<PackagingAudioPlanningContract | undefined>(undefined);
  readonly platform = input.required<PlatformContract>();
  readonly contentType = input.required<ContentTypeContract | null | undefined>();
  readonly disabled = input(false);

  readonly valueChange = output<PackagingAudioPlanningContract>();

  protected readonly strategyOptions = STRATEGY_OPTIONS;
  protected readonly moodOptions = MOOD_OPTIONS;
  protected readonly audioTooltip = AUDIO_TOOLTIP;

  /**
   * Canonical type derived from the (platform, contentType) pair.
   * Returns undefined when no mapping exists for the combo, which
   * collapses the card to hidden.
   */
  protected readonly canonicalType = computed(() =>
    getCanonicalType(this.platform(), this.contentType()),
  );

  protected readonly visible = computed<boolean>(() => {
    const ct = this.canonicalType();
    if (!ct) return false;
    return AUDIO_PLANNING_CANONICAL_TYPES.includes(ct);
  });

  /** Default to 'named' when unset (per AC). */
  protected readonly strategy = computed<AudioStrategyContract>(
    () => this.value()?.audioStrategy ?? 'named',
  );

  protected readonly mood = computed<AudioMoodContract | undefined>(
    () => this.value()?.audioMood,
  );

  protected readonly moodVisible = computed<boolean>(
    () => this.strategy() === 'trending-platform',
  );

  /** Dropdown options projected from MOOD_OPTIONS. */
  protected readonly moodDropdownOptions = computed<DropdownOption[]>(() =>
    this.moodOptions.map((m) => ({
      value: m.value,
      label: `${m.label} — ${m.description}`,
    })),
  );

  protected onStrategyClick(next: AudioStrategyContract): void {
    if (this.disabled()) return;
    if (this.strategy() === next) return;
    const base: PackagingAudioPlanningContract = this.value() ?? {};
    if (next === 'named') {
      // Flipping back to Named — clear any mood we'd captured under
      // Trending/Platform so it can't reappear silently if the user
      // flips again.
      this.valueChange.emit({
        ...base,
        audioStrategy: next,
        audioMood: undefined,
      });
      return;
    }
    this.valueChange.emit({ ...base, audioStrategy: next });
  }

  /**
   * Keyboard handler for the strategy toggle's `role="radio"` buttons:
   * Left/Up moves to the previous option, Right/Down to the next.
   * Space/Enter is left to native button activation.
   */
  protected onStrategyKeydown(event: KeyboardEvent): void {
    if (this.disabled()) return;
    const key = event.key;
    if (
      key !== 'ArrowLeft' &&
      key !== 'ArrowRight' &&
      key !== 'ArrowUp' &&
      key !== 'ArrowDown'
    ) {
      return;
    }
    event.preventDefault();
    const idx = this.strategyOptions.findIndex((o) => o.value === this.strategy());
    const last = this.strategyOptions.length - 1;
    const nextIdx =
      key === 'ArrowLeft' || key === 'ArrowUp'
        ? idx <= 0
          ? last
          : idx - 1
        : idx >= last
          ? 0
          : idx + 1;
    const next = this.strategyOptions[nextIdx];
    if (next) this.onStrategyClick(next.value);
  }

  protected onMoodChange(value: string): void {
    if (this.disabled()) return;
    const base: PackagingAudioPlanningContract = this.value() ?? {};
    this.valueChange.emit({
      ...base,
      audioStrategy: 'trending-platform',
      audioMood: (value || undefined) as AudioMoodContract | undefined,
    });
  }
}
