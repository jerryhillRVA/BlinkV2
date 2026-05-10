import { Component, computed, inject } from '@angular/core';
import { PostDetailStore } from '../../../post-detail.store';
import { AssetUploaderComponent } from '../_shared/asset-uploader/asset-uploader.component';
import { HashtagInputComponent } from '../_shared/hashtag-input/hashtag-input.component';

const CAPTION_MAX = 3000;

@Component({
  selector: 'app-text-builder',
  imports: [AssetUploaderComponent, HashtagInputComponent],
  templateUrl: './text-builder.component.html',
  styleUrl: './text-builder.component.scss',
})
export class TextBuilderComponent {
  protected readonly store = inject(PostDetailStore);

  protected readonly draft = this.store.textDraft;
  protected readonly disabled = computed(
    () => !this.store.item()?.briefApproved,
  );
  protected readonly captionMax = CAPTION_MAX;
  protected readonly captionLength = computed(
    () => (this.draft().caption ?? '').length,
  );

  protected onCaptionInput(e: Event): void {
    const v = (e.target as HTMLTextAreaElement).value ?? '';
    this.store.setTextCaption(v.slice(0, this.captionMax));
  }

  protected onCaptionAssist(): void {
    if (this.disabled()) return;
    this.store.setTextCaption(
      'Three months in. Here are the five things I’d tell day-one me — none of them are about willpower.',
    );
  }

  protected onFileChange(file: { name: string; size: number } | null): void {
    this.store.setTextImageRef(file ? file.name : '');
  }

  protected onAltInput(e: Event): void {
    this.store.setTextAltText((e.target as HTMLTextAreaElement).value ?? '');
  }

  protected onHashtags(tags: string[]): void {
    this.store.setTextHashtags(tags);
  }
}
