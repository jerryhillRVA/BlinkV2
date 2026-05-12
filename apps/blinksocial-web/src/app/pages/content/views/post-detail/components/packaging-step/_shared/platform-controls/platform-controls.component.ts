import { Component, computed, input, output } from '@angular/core';
import type {
  PackagingPlatformControlsContract,
  PackagingVisibilityContract,
  PlatformContract,
} from '@blinksocial/contracts';

interface VisibilityOption {
  value: PackagingVisibilityContract;
  label: string;
}

const ALL_VISIBILITY: ReadonlyArray<VisibilityOption> = [
  { value: 'public', label: 'Public' },
  { value: 'unlisted', label: 'Unlisted' },
  { value: 'private', label: 'Private' },
];

const PUBLIC_PRIVATE: ReadonlyArray<VisibilityOption> = [
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
];

const PUBLIC_ONLY: ReadonlyArray<VisibilityOption> = [
  { value: 'public', label: 'Public' },
];

const VISIBILITY_BY_PLATFORM: Record<PlatformContract, ReadonlyArray<VisibilityOption>> = {
  instagram: PUBLIC_PRIVATE,
  facebook: PUBLIC_PRIVATE,
  tiktok: PUBLIC_ONLY,
  x: PUBLIC_ONLY,
  youtube: ALL_VISIBILITY,
  linkedin: ALL_VISIBILITY,
  tbd: PUBLIC_PRIVATE,
};

/**
 * Per-platform visibility radios + a few switch toggles (Allow
 * comments; TikTok-only Allow Duet/Stitch; Facebook-only Enable Boost).
 * Each control emits the merged-and-patched contract via
 * `controlsChange`.
 */
@Component({
  selector: 'app-platform-controls',
  templateUrl: './platform-controls.component.html',
  styleUrl: './platform-controls.component.scss',
})
export class PlatformControlsComponent {
  readonly controls = input<PackagingPlatformControlsContract | undefined>(undefined);
  readonly platform = input.required<PlatformContract>();
  readonly disabled = input(false);

  readonly controlsChange = output<PackagingPlatformControlsContract>();

  protected readonly visibilityOptions = computed(
    () => VISIBILITY_BY_PLATFORM[this.platform()] ?? PUBLIC_PRIVATE,
  );

  protected readonly showDuetStitch = computed(() => this.platform() === 'tiktok');
  protected readonly showBoost = computed(() => this.platform() === 'facebook');

  protected readonly currentVisibility = computed(
    () => this.controls()?.visibility ?? 'public',
  );

  protected readonly allowComments = computed(
    () => this.controls()?.allowComments ?? true,
  );

  protected readonly allowDuetStitch = computed(
    () => this.controls()?.allowDuetStitch ?? false,
  );

  protected readonly boostEnabled = computed(
    () => this.controls()?.boostEnabled ?? false,
  );

  protected onVisibility(value: PackagingVisibilityContract): void {
    if (this.disabled()) return;
    this.emitPatch({ visibility: value });
  }

  protected onToggleComments(): void {
    if (this.disabled()) return;
    this.emitPatch({ allowComments: !this.allowComments() });
  }

  protected onToggleDuetStitch(): void {
    if (this.disabled()) return;
    this.emitPatch({ allowDuetStitch: !this.allowDuetStitch() });
  }

  protected onToggleBoost(): void {
    if (this.disabled()) return;
    this.emitPatch({ boostEnabled: !this.boostEnabled() });
  }

  protected radioId(value: string): string {
    return `pc-vis-${value}`;
  }

  private emitPatch(patch: Partial<PackagingPlatformControlsContract>): void {
    this.controlsChange.emit({ ...(this.controls() ?? {}), ...patch });
  }
}
