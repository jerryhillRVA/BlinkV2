import { Component, computed, inject } from '@angular/core';
import type { DraftCarouselSlideContract } from '@blinksocial/contracts';
import { PostDetailStore } from '../../../post-detail.store';
import { AssetUploaderComponent } from '../_shared/asset-uploader/asset-uploader.component';
import { HashtagInputComponent } from '../_shared/hashtag-input/hashtag-input.component';

let nextId = 1;
const newId = () => `cs-${Date.now().toString(36)}-${nextId++}`;

@Component({
  selector: 'app-carousel-builder',
  imports: [AssetUploaderComponent, HashtagInputComponent],
  templateUrl: './carousel-builder.component.html',
  styleUrl: './carousel-builder.component.scss',
})
export class CarouselBuilderComponent {
  protected readonly store = inject(PostDetailStore);

  protected readonly draft = this.store.carouselDraft;
  protected readonly disabled = computed(
    () => !this.store.item()?.briefApproved,
  );

  protected readonly slides = computed(() => this.draft().slides ?? []);

  protected onHookInput(e: Event): void {
    this.store.setCarouselHook((e.target as HTMLTextAreaElement).value ?? '');
  }
  protected onHookAssist(): void {
    if (this.disabled()) return;
    this.store.setCarouselHook('Five things I wish I had known on day one.');
  }

  protected onAddSlide(): void {
    if (this.disabled()) return;
    this.store.setCarouselSlides([
      ...this.slides(),
      { id: newId(), headline: '', body: '' },
    ]);
  }

  protected onRemoveSlide(id: string): void {
    if (this.disabled()) return;
    this.store.setCarouselSlides(this.slides().filter((s) => s.id !== id));
  }

  protected onMoveUp(i: number): void {
    if (this.disabled() || i === 0) return;
    const list = [...this.slides()];
    [list[i - 1], list[i]] = [list[i], list[i - 1]];
    this.store.setCarouselSlides(list);
  }

  protected onMoveDown(i: number): void {
    const list = this.slides();
    if (this.disabled() || i === list.length - 1) return;
    const next = [...list];
    [next[i + 1], next[i]] = [next[i], next[i + 1]];
    this.store.setCarouselSlides(next);
  }

  protected onSlideHeadline(id: string, e: Event): void {
    if (this.disabled()) return;
    this.patchSlide(id, {
      headline: (e.target as HTMLInputElement).value ?? '',
    });
  }

  protected onSlideBody(id: string, e: Event): void {
    if (this.disabled()) return;
    this.patchSlide(id, {
      body: (e.target as HTMLTextAreaElement).value ?? '',
    });
  }

  protected onSlideAlt(id: string, e: Event): void {
    if (this.disabled()) return;
    this.patchSlide(id, {
      altText: (e.target as HTMLTextAreaElement).value ?? '',
    });
  }

  protected onSlideFile(
    id: string,
    file: { name: string; size: number } | null,
  ): void {
    this.patchSlide(id, { imageRef: file ? file.name : undefined });
  }

  private patchSlide(
    id: string,
    patch: Partial<DraftCarouselSlideContract>,
  ): void {
    this.store.setCarouselSlides(
      this.slides().map((s) => (s.id === id ? { ...s, ...patch } : s)),
    );
  }

  protected onHashtags(tags: string[]): void {
    this.store.setCarouselHashtags(tags);
  }
}
