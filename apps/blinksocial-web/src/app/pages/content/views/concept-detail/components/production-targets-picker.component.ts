import { Component, EventEmitter, Output, computed, input } from '@angular/core';
import { PlatformIconComponent } from '../../../../../shared/platform-icon/platform-icon.component';
import {
  PLATFORM_CONTENT_TYPES,
  PLATFORM_OPTIONS,
} from '../../../content.constants';
import type { ContentType, Platform } from '../../../content.types';
import type { TargetPlatform } from '../concept-detail.types';

interface TargetGroup {
  platform: Platform;
  platformLabel: string;
  options: { contentType: ContentType; label: string; selected: boolean; inProduction: boolean }[];
}

@Component({
  selector: 'app-production-targets-picker',
  imports: [PlatformIconComponent],
  templateUrl: './production-targets-picker.component.html',
  styleUrl: './production-targets-picker.component.scss',
})
export class ProductionTargetsPickerComponent {
  readonly selected = input<TargetPlatform[]>([]);
  /** Returns true when (platform, contentType) is already a post item */
  readonly isInProduction = input<(target: TargetPlatform) => boolean>(
    () => false,
  );

  @Output() toggleTarget = new EventEmitter<TargetPlatform>();

  protected readonly groups = computed<TargetGroup[]>(() => {
    const sel = this.selected();
    const inProd = this.isInProduction();
    return PLATFORM_OPTIONS.filter((p) => p.value !== 'tbd').map((p) => ({
      platform: p.value,
      platformLabel: p.label,
      options: PLATFORM_CONTENT_TYPES[p.value].map((ct) => ({
        contentType: ct.value,
        label: ct.label,
        selected: sel.some(
          (t) => t.platform === p.value && t.contentType === ct.value,
        ),
        inProduction: inProd({ platform: p.value, contentType: ct.value }),
      })),
    }));
  });

  protected onToggle(platform: Platform, contentType: ContentType, disabled: boolean): void {
    if (disabled) return;
    this.toggleTarget.emit({ platform, contentType, postId: null });
  }
}
