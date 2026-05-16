import { Component, computed, input, output } from '@angular/core';
import type {
  AudioMoodContract,
  AudioStrategyContract,
  ContentTypeContract,
  PackagingAudioPlanningContract,
  PlatformContract,
} from '@blinksocial/contracts';
import { DropdownComponent, type DropdownOption } from '../../../../../../../../shared/dropdown/dropdown.component';
import { IconComponent } from '../../../../../../../../shared/icons/icon.component';
import { TooltipComponent } from '../../../../../../../../shared/tooltip/tooltip.component';
import { getCanonicalType } from '../../../draft-step/draft-canonical.utils';
import {
  AUDIO_PLANNING_CANONICAL_TYPES,
  AUDIO_TOOLTIP,
  MOOD_OPTIONS,
  STRATEGY_OPTIONS,
} from './audio-planning.constants';

/**
 * #147 (PKG-1): Audio Planning sub-section. Mounts INSIDE
 * `<app-media-selections-card>` (matches prototype layout, not its own
 * card). Header + Strategy Mode segmented toggle + conditional Video
 * Vibe & Pace native dropdown.
 *
 * Renders only for canonical content types in
 * `AUDIO_PLANNING_CANONICAL_TYPES` (VIDEO_SHORT_VERTICAL,
 * VIDEO_SHORT_HORIZONTAL, STORY_FRAME_SET); hides itself otherwise so
 * the parent doesn't need its own gate.
 */
@Component({
  selector: 'app-audio-planning-section',
  imports: [DropdownComponent, IconComponent, TooltipComponent],
  templateUrl: './audio-planning-section.component.html',
  styleUrl: './audio-planning-section.component.scss',
})
export class AudioPlanningSectionComponent {
  /* v8 ignore next 4 — V8's function-call-throws branches on input() declarations are unreachable (Angular class-field init time; ESM exports not spy-able) */
  readonly value = input<PackagingAudioPlanningContract | undefined>(undefined);
  readonly platform = input.required<PlatformContract>();
  readonly contentType = input.required<ContentTypeContract | null | undefined>();
  readonly disabled = input(false);

  readonly valueChange = output<PackagingAudioPlanningContract>();

  protected readonly strategyOptions = STRATEGY_OPTIONS;
  protected readonly moodOptions = MOOD_OPTIONS;
  protected readonly audioTooltip = AUDIO_TOOLTIP;
  protected readonly moodPlaceholder = 'Select a mood…';

  /**
   * Dropdown options pre-shaped for `<app-dropdown>`. The label is the
   * mood label + a thin em-dash + the description, mirroring the
   * prototype's `Energetic / Pumped — High-intensity rhythm…` rendering.
   */
  protected readonly moodDropdownOptions: DropdownOption[] = MOOD_OPTIONS.map((m) => ({
    value: m.value,
    label: `${m.label} — ${m.description}`,
    iconName: m.iconName,
  }));

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

  protected onStrategyClick(next: AudioStrategyContract): void {
    if (this.disabled()) return;
    if (this.strategy() === next) return;
    const base: PackagingAudioPlanningContract = this.value() ?? {};
    if (next === 'named') {
      // Flipping back to Named — clear audioMood so it can't reappear
      // silently if the user flips again.
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
   * Arrow keys on the segmented toggle: Left/Up → previous, Right/Down → next.
   * Space/Enter is native button activation.
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

  /**
   * `<app-dropdown>` emits the raw `value` string. Empty string would
   * represent the placeholder, which the dropdown can't surface
   * (the dropdown never echoes the placeholder back through valueChange),
   * but we still defensively clear `audioMood` on a falsy emit so the
   * branch is reachable from tests.
   */
  protected onMoodSelect(next: string): void {
    if (this.disabled()) return;
    const base: PackagingAudioPlanningContract = this.value() ?? {};
    this.valueChange.emit({
      ...base,
      audioStrategy: 'trending-platform',
      audioMood: (next || undefined) as AudioMoodContract | undefined,
    });
  }
}
