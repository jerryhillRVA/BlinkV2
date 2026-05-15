import {
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import type { DraftUploadedAssetContract } from '@blinksocial/contracts';
import { SectionLabelComponent } from '../section-label/section-label.component';

const ALLOWED_MIME_TYPES = new Set([
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-matroska',
]);

let nextAssetId = 1;
function newAssetId(): string {
  return `ua-${Date.now().toString(36)}-${nextAssetId++}`;
}

/**
 * #139: shared pool of uploaded assets for the short-form video draft.
 * Lives above `<app-shot-list>`. The pool replaces the prior top-level
 * `coverAssetRef` slot inside `<app-shot-list>` and the per-shot
 * "Attach file" dropzones. Shot rows now reference pool entries by
 * `id`.
 *
 * The component is presentational — it does not persist directly.
 * `added` and `removed` outputs are routed by the parent
 * (`<app-video-builder>`) into `store.setVideoUploadedAssets(...)` and,
 * on remove, a cascading `store.setVideoShotList(...)` to clear any
 * shot whose `assetRef` matched the removed asset.
 */
@Component({
  selector: 'app-upload-assets',
  imports: [SectionLabelComponent],
  templateUrl: './upload-assets.component.html',
  styleUrl: './upload-assets.component.scss',
})
export class UploadAssetsComponent {
  /* v8 ignore next 2 — V8's function-call-throws branches on input() declarations are unreachable (Angular class-field init time; ESM exports not spy-able) */
  readonly assets = input.required<ReadonlyArray<DraftUploadedAssetContract>>();
  readonly disabled = input<boolean>(false);

  readonly added = output<DraftUploadedAssetContract[]>();
  readonly removed = output<string>();

  /* v8 ignore next 1 — local signal, framework-init throws path unreachable */
  protected readonly rejectError = signal<string | null>(null);

  /**
   * Blob URLs we generated locally. Tracked here so we can revoke them
   * on component destroy + on individual asset removal. Pre-existing
   * URLs from a prior render of the parent (e.g. an AFS-served https://)
   * are NOT revoked — only URLs we created via createObjectURL.
   */
  private readonly localBlobUrls = new Set<string>();

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      for (const url of this.localBlobUrls) {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // ignore — page-unload races + browsers that already cleared
        }
      }
      this.localBlobUrls.clear();
    });
  }

  protected readonly hasAssets = computed(() => this.assets().length > 0);

  protected readonly assetCountLabel = computed<string | null>(() => {
    const n = this.assets().length;
    if (n === 0) return null;
    return n === 1 ? '1 asset' : `${n} assets`;
  });

  protected onFiles(event: Event): void {
    if (this.disabled()) return;
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    if (files.length === 0) return;
    const accepted: DraftUploadedAssetContract[] = [];
    const rejected: string[] = [];
    for (const file of files) {
      if (this.isAllowedMime(file.type)) {
        // Generate a transient blob URL so the thumbnail can render a
        // first-frame preview via <video>. Tracked for cleanup.
        let previewUrl: string | undefined;
        try {
          previewUrl = URL.createObjectURL(file);
          this.localBlobUrls.add(previewUrl);
        } catch {
          // URL.createObjectURL can throw if the runtime is unusual
          // (older jsdom etc) — fall back to no preview.
          previewUrl = undefined;
        }
        accepted.push({
          id: newAssetId(),
          filename: file.name,
          mimeType: file.type || undefined,
          size: file.size,
          previewUrl,
        });
      } else {
        rejected.push(file.name);
      }
    }
    // Reset the native file input so picking the same file twice still
    // fires (change events only emit on value-set changes).
    input.value = '';
    if (rejected.length > 0) {
      this.rejectError.set(
        rejected.length === 1
          ? `${rejected[0]} is not a supported video file.`
          : `${rejected.length} files were not supported video formats.`,
      );
    } else {
      this.rejectError.set(null);
    }
    if (accepted.length > 0) {
      this.added.emit(accepted);
    }
  }

  protected onRemove(id: string): void {
    if (this.disabled()) return;
    // Revoke the local blob URL if we created it. Parent will emit a
    // new `assets` array without this entry on the next tick.
    const target = this.assets().find((a) => a.id === id);
    const url = target?.previewUrl;
    if (url && this.localBlobUrls.has(url)) {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // ignore
      }
      this.localBlobUrls.delete(url);
    }
    this.removed.emit(id);
  }

  protected isVideoMime(mimeType: string | undefined): boolean {
    return !!mimeType && mimeType.startsWith('video/');
  }

  private isAllowedMime(mime: string): boolean {
    // Empty mime types are accepted (some browsers emit empty for .mov on
    // older OSes). The accept="video/*" attribute already filters in the
    // OS picker; this allow-list is a defense-in-depth backstop.
    if (!mime) return true;
    return ALLOWED_MIME_TYPES.has(mime) || mime.startsWith('video/');
  }
}
