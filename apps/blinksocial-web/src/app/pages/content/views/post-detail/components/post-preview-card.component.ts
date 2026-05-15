import { Component, computed, input, model, signal } from '@angular/core';
import type { ContentTypeContract, PlatformContract } from '@blinksocial/contracts';

/**
 * Post Preview card — sidebar mockup of how the published post will appear
 * on the active platform. Renders only for Instagram and TikTok (other
 * platforms produce no preview card; see PostPreview.tsx in the prototype).
 *
 * The card itself is collapsible (defaults to collapsed); expanding reveals
 * a small-scale visual of the post (header / media / caption for IG; the
 * 9/16 dark frame for TikTok).
 *
 * `expanded` is a `model()` so the parent can preserve the expand/collapse
 * state across `@switch` transitions (e.g. Packaging ↔ Approve & Schedule)
 * via two-way binding `[(expanded)]="parentSignal"`. The component is
 * destroyed/re-created on step switch — without parent-owned state, the
 * local signal would reset to collapsed every time.
 */
@Component({
  selector: 'app-post-preview-card',
  templateUrl: './post-preview-card.component.html',
  styleUrl: './post-preview-card.component.scss',
})
export class PostPreviewCardComponent {
  /* v8 ignore next 9 — V8's function-call-throws branches on input()/signal() declarations are unreachable (Angular class-field init time; ESM exports not spy-able) */
  readonly platform = input.required<PlatformContract | null | undefined>();
  readonly contentType = input<ContentTypeContract | null | undefined>(undefined);
  readonly caption = input<string>('');
  readonly handle = input<string>('@your_handle');
  readonly slides = input<ReadonlyArray<string>>([]);
  readonly coverAsset = input<string | undefined>(undefined);
  readonly expanded = model<boolean>(false);
  protected readonly slideIndex = signal(0);

  protected readonly visible = computed(
    () => this.platform() === 'instagram' || this.platform() === 'tiktok',
  );

  /** Total slides drives the carousel UI (arrows + dot indicators). */
  protected readonly totalSlides = computed(() => this.slides().length);

  /** Carousel-ish if the canonical content-type is a multi-slide layout or
   *  if we have more than one slide URL. Matches PostPreview.tsx:30. */
  protected readonly isCarousel = computed(() => {
    const t = this.contentType();
    if (t === 'carousel' || t === 'photo-carousel') return true;
    return this.totalSlides() > 1;
  });

  /** IG media aspect ratio: 4/5 for vertical video / story; 1/1 otherwise. */
  protected readonly igAspectRatio = computed(() => {
    const t = this.contentType();
    return t === 'reel' || t === 'story' ? '4 / 5' : '1 / 1';
  });

  /** Capped to 7 dots in the prototype to avoid runaway pagination. */
  protected readonly dotCount = computed(() => Math.min(this.totalSlides(), 7));

  /** Current slide URL, falling back to coverAsset when slides[] is empty. */
  protected readonly currentSrc = computed<string | undefined>(() => {
    const s = this.slides();
    const i = this.slideIndex();
    return s[i] ?? this.coverAsset();
  });

  protected readonly canPrev = computed(() => this.slideIndex() > 0);
  protected readonly canNext = computed(
    () => this.slideIndex() < this.totalSlides() - 1,
  );

  protected toggleExpanded(): void {
    this.expanded.update((v) => !v);
  }

  protected prev(): void {
    this.slideIndex.update((i) => Math.max(0, i - 1));
  }

  protected next(): void {
    this.slideIndex.update((i) => Math.min(this.totalSlides() - 1, i + 1));
  }

  /** Indices 0..dotCount-1 for the *ngFor in the template (dot indicators). */
  protected dotIndices(): number[] {
    return Array.from({ length: this.dotCount() }, (_, i) => i);
  }

  /** Capitalized platform label for the header chip (e.g. "Instagram"). */
  protected readonly platformLabel = computed(() => {
    const p = this.platform();
    if (!p) return '';
    return p.charAt(0).toUpperCase() + p.slice(1);
  });
}
