import { Component, computed, inject, signal } from '@angular/core';
import { PostDetailStore } from '../../../post-detail.store';
import { AssetUploaderComponent } from '../_shared/asset-uploader/asset-uploader.component';
import { HashtagInputComponent } from '../_shared/hashtag-input/hashtag-input.component';

@Component({
  selector: 'app-image-single-builder',
  imports: [AssetUploaderComponent, HashtagInputComponent],
  templateUrl: './image-single-builder.component.html',
  styleUrl: './image-single-builder.component.scss',
})
export class ImageSingleBuilderComponent {
  protected readonly store = inject(PostDetailStore);

  protected readonly draft = this.store.imageSingleDraft;
  protected readonly disabled = computed(
    () => !this.store.item()?.briefApproved,
  );
  /* v8 ignore next 1 — V8's function-call-throws branches on input()/signal() declarations are unreachable (Angular class-field init time; ESM exports not spy-able) */
  protected readonly creativeOpen = signal(false);

  protected onHookInput(e: Event): void {
    this.store.setImageSingleHook((e.target as HTMLTextAreaElement).value ?? '');
  }
  protected onHookAssist(): void {
    if (this.disabled()) return;
    this.store.setImageSingleHook(
      'Three months in: here is what changed first.',
    );
  }
  protected onCreativeInput(e: Event): void {
    this.store.setImageSingleCreativeDirectionNotes(
      (e.target as HTMLTextAreaElement).value ?? '',
    );
  }
  protected onCreativeAssist(): void {
    if (this.disabled()) return;
    this.store.setImageSingleCreativeDirectionNotes(
      'Soft natural light, real environment, candid expression. Avoid stock-photo polish.',
    );
  }
  protected toggleCreative(): void {
    this.creativeOpen.update((v) => !v);
  }

  protected onAltInput(e: Event): void {
    this.store.setImageSingleAltText((e.target as HTMLTextAreaElement).value ?? '');
  }
  protected onAltAssist(): void {
    if (this.disabled()) return;
    this.store.setImageSingleAltText(
      'A woman smiling at the camera in soft morning light, holding a yoga mat.',
    );
  }

  protected onFileChange(file: { name: string; size: number } | null): void {
    if (!file) {
      this.store.setImageSingleImageRef('');
      return;
    }
    this.store.setImageSingleImageRef(file.name);
  }

  protected onAiGenerate(): void {
    if (this.disabled()) return;
    this.store.setImageSingleImageRef('ai-generated-image.png');
  }

  protected onHashtags(tags: string[]): void {
    this.store.setImageSingleHashtags(tags);
  }
}
