import { Component, EventEmitter, Output, computed, input } from '@angular/core';
import { PlatformIconComponent } from '../../../../../shared/platform-icon/platform-icon.component';
import {
  PLATFORM_CONTENT_TYPES,
  PLATFORM_OPTIONS,
} from '../../../content.constants';
import type { ContentItem, Platform } from '../../../content.types';

interface ChipModel {
  id: string;
  platform: Platform | 'tbd';
  platformLabel: string;
  contentTypeLabel: string;
  active: boolean;
}

@Component({
  selector: 'app-variation-chips',
  imports: [PlatformIconComponent],
  templateUrl: './variation-chips.component.html',
  styleUrl: './variation-chips.component.scss',
})
export class VariationChipsComponent {
  readonly items = input<ContentItem[]>([]);
  readonly activeId = input.required<string>();

  @Output() open = new EventEmitter<string>();

  protected readonly chips = computed<ChipModel[]>(() => {
    return this.items().map((it) => ({
      id: it.id,
      platform: it.platform ?? 'tbd',
      platformLabel: this.platformLabel(it.platform),
      contentTypeLabel: this.contentTypeLabel(it.platform, it.contentType),
      active: it.id === this.activeId(),
    }));
  });

  protected readonly hasSiblings = computed(() => this.chips().length > 1);

  protected onOpen(id: string): void {
    if (id === this.activeId()) return;
    this.open.emit(id);
  }

  private platformLabel(p: ContentItem['platform']): string {
    if (!p) return 'Unknown';
    return PLATFORM_OPTIONS.find((o) => o.value === p)?.label ?? p;
  }

  private contentTypeLabel(
    p: ContentItem['platform'],
    ct: ContentItem['contentType'],
  ): string {
    if (!p || !ct) return 'Unknown';
    return (
      PLATFORM_CONTENT_TYPES[p]?.find((o) => o.value === ct)?.label ?? ct
    );
  }
}
