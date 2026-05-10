import { Component, computed, effect, inject } from '@angular/core';
import { PostDetailStore } from '../../post-detail.store';
import { getDraftMode } from './draft-canonical.utils';
import { BuilderPlaceholderComponent } from './builder-placeholder/builder-placeholder.component';
import { VideoBuilderComponent } from './video-builder/video-builder.component';
import { VideoLongBuilderComponent } from './video-long-builder/video-long-builder.component';
import { ImageSingleBuilderComponent } from './image-single-builder/image-single-builder.component';
import { CarouselBuilderComponent } from './carousel-builder/carousel-builder.component';
import { TextBuilderComponent } from './text-builder/text-builder.component';

@Component({
  selector: 'app-draft-step',
  imports: [
    BuilderPlaceholderComponent,
    VideoBuilderComponent,
    VideoLongBuilderComponent,
    ImageSingleBuilderComponent,
    CarouselBuilderComponent,
    TextBuilderComponent,
  ],
  templateUrl: './draft-step.component.html',
  styleUrl: './draft-step.component.scss',
})
export class DraftStepComponent {
  protected readonly store = inject(PostDetailStore);

  // Derived mode from (platform, contentType). Recomputes when the post
  // changes platform/contentType.
  protected readonly mode = computed(() => {
    const item = this.store.item();
    return getDraftMode(item?.platform ?? null, item?.contentType ?? null);
  });

  constructor() {
    // Persist the canonical mode at brief-approval time so a later platform
    // / contentType change can't silently retarget the draft.
    effect(() => {
      const item = this.store.item();
      if (!item?.briefApproved) return;
      const derived = this.mode();
      if (item.production?.draft?.mode !== derived) {
        this.store.setDraftMode(derived);
      }
    });
  }

}
