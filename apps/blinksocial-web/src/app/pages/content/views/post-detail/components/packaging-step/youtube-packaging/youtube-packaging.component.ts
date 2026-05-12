import { Component, computed, input, output } from '@angular/core';
import type {
  PackagingPlatformControlsContract,
  PackagingYouTubeContract,
} from '@blinksocial/contracts';
import { AssetUploaderComponent } from '../../draft-step/_shared/asset-uploader/asset-uploader.component';
import { KeywordInputComponent } from '../_shared/keyword-input/keyword-input.component';
import { PlatformControlsComponent } from '../_shared/platform-controls/platform-controls.component';

const TITLE_MAX = 100;
const DESCRIPTION_MAX = 5000;
const WARN_RATIO = 0.9;

export const YOUTUBE_CATEGORIES: ReadonlyArray<{ value: string; label: string }> = [
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'education', label: 'Education' },
  { value: 'music', label: 'Music' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'how-to', label: 'How-to' },
  { value: 'tech', label: 'Tech' },
  { value: 'vlog', label: 'Vlog' },
  { value: 'news', label: 'News' },
  { value: 'other', label: 'Other' },
];

@Component({
  selector: 'app-youtube-packaging',
  imports: [KeywordInputComponent, AssetUploaderComponent, PlatformControlsComponent],
  templateUrl: './youtube-packaging.component.html',
  styleUrl: './youtube-packaging.component.scss',
})
export class YoutubePackagingComponent {
  readonly value = input<PackagingYouTubeContract | undefined>(undefined);
  readonly disabled = input(false);

  readonly valueChange = output<PackagingYouTubeContract>();

  protected readonly titleMax = TITLE_MAX;
  protected readonly descriptionMax = DESCRIPTION_MAX;
  protected readonly categories = YOUTUBE_CATEGORIES;

  protected readonly title = computed(() => this.value()?.title ?? '');
  protected readonly description = computed(() => this.value()?.description ?? '');
  protected readonly tags = computed(() => this.value()?.tags ?? []);
  protected readonly categoryId = computed(() => this.value()?.categoryId ?? '');
  protected readonly thumbnailRef = computed(() => this.value()?.thumbnailRef);
  protected readonly controls = computed(() => this.value()?.platformControls);

  protected readonly titleState = computed(() => {
    const len = this.title().length;
    if (len >= TITLE_MAX) return 'fail';
    if (len >= TITLE_MAX * WARN_RATIO) return 'warn';
    return 'ok';
  });

  protected readonly descriptionState = computed(() => {
    const len = this.description().length;
    if (len >= DESCRIPTION_MAX) return 'fail';
    if (len >= DESCRIPTION_MAX * WARN_RATIO) return 'warn';
    return 'ok';
  });

  protected onTitleInput(e: Event): void {
    this.patch({ title: (e.target as HTMLInputElement).value ?? '' });
  }

  protected onDescriptionInput(e: Event): void {
    this.patch({ description: (e.target as HTMLTextAreaElement).value ?? '' });
  }

  protected onTagsChange(tags: string[]): void {
    this.patch({ tags });
  }

  protected onCategoryChange(e: Event): void {
    this.patch({ categoryId: (e.target as HTMLSelectElement).value });
  }

  protected onThumbnailChange(file: { name: string; size: number } | null): void {
    this.patch({ thumbnailRef: file ? file.name : '' });
  }

  protected onControlsChange(controls: PackagingPlatformControlsContract): void {
    this.patch({ platformControls: controls });
  }

  private patch(delta: Partial<PackagingYouTubeContract>): void {
    this.valueChange.emit({ ...(this.value() ?? {}), ...delta });
  }
}
