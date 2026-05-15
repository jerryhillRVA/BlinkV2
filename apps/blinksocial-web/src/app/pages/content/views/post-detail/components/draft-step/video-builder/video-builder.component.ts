import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import type {
  AiAssistFieldContract,
  DraftShotItemContract,
  DraftUploadedAssetContract,
} from '@blinksocial/contracts';
import { PostDetailStore } from '../../../post-detail.store';
import { ContentStateService } from '../../../../../content-state.service';
import { AiAssistApiService } from '../../../../../../../core/ai-assist/ai-assist.service';
import { ToastService } from '../../../../../../../core/toast/toast.service';
import { ShotListComponent } from '../_shared/shot-list/shot-list.component';
import { UploadAssetsComponent } from '../_shared/upload-assets/upload-assets.component';
import { SectionLabelComponent } from '../_shared/section-label/section-label.component';
import { AiButtonComponent } from '../_shared/ai-button/ai-button.component';
import {
  PillGroupComponent,
  type PillOption,
} from '../_shared/pill-group/pill-group.component';

const TARGET_DURATIONS: PillOption[] = [
  { value: '15s', label: '15s' },
  { value: '30s', label: '30s' },
  { value: '60s', label: '60s' },
  { value: '90s', label: '90s' },
  { value: '2m', label: '2m' },
  { value: '3m', label: '3m' },
];

@Component({
  selector: 'app-video-builder',
  imports: [
    FormsModule,
    ShotListComponent,
    UploadAssetsComponent,
    SectionLabelComponent,
    AiButtonComponent,
    PillGroupComponent,
  ],
  templateUrl: './video-builder.component.html',
  styleUrl: './video-builder.component.scss',
})
export class VideoBuilderComponent {
  protected readonly store = inject(PostDetailStore);
  private readonly contentState = inject(ContentStateService);
  private readonly aiAssist = inject(AiAssistApiService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly draft = this.store.videoDraft;
  protected readonly disabled = computed(
    () => !this.store.item()?.briefApproved,
  );
  /* v8 ignore next 6 — V8's function-call-throws branches on input()/signal() declarations are unreachable (Angular class-field init time; ESM exports not spy-able) */
  protected readonly hookBankOpen = signal(false);
  protected readonly hookBankLoading = signal(false);
  protected readonly bRollOpen = signal(false);
  protected readonly voiceoverOpen = signal(false);
  protected readonly bodyAiLoading = signal(false);
  protected readonly ctaAiLoading = signal(false);

  protected readonly durationOptions = TARGET_DURATIONS;

  protected readonly duration = computed(
    () => this.draft().targetDuration ?? '30s',
  );

  protected readonly shotCount = computed(
    () => this.draft().shotList?.length ?? 0,
  );

  protected readonly shotsRequired = computed(() => this.shotCount() === 0);

  protected readonly uploadedAssets = computed<ReadonlyArray<DraftUploadedAssetContract>>(
    () => this.draft().uploadedAssets ?? [],
  );

  // CTA Type comes from the (locked) brief — surfaced here as a helper line.
  protected readonly ctaTypeLabel = computed(() => {
    const ct = this.store.item()?.cta?.type;
    if (!ct) return null;
    return ct.replace(/-/g, ' ').toUpperCase();
  });

  protected onHookInput(e: Event): void {
    this.store.setVideoHook((e.target as HTMLTextAreaElement).value ?? '');
  }
  protected onBodyInput(e: Event): void {
    this.store.setVideoBody((e.target as HTMLTextAreaElement).value ?? '');
  }
  protected onCtaInput(e: Event): void {
    this.store.setVideoCta((e.target as HTMLTextAreaElement).value ?? '');
  }
  protected onBRollInput(e: Event): void {
    this.store.setVideoBRollNotes((e.target as HTMLTextAreaElement).value ?? '');
  }
  protected onVoiceoverInput(e: Event): void {
    this.store.setVideoVoiceoverNotes(
      (e.target as HTMLTextAreaElement).value ?? '',
    );
  }
  protected onDurationChange(v: string): void {
    this.store.setVideoTargetDuration(v);
  }

  protected onShotsChange(shots: DraftShotItemContract[]): void {
    this.store.setVideoShotList(shots);
  }

  protected onAssetsAdded(newAssets: DraftUploadedAssetContract[]): void {
    const pool = this.uploadedAssets();
    this.store.setVideoUploadedAssets([...pool, ...newAssets]);
  }

  protected onAssetRemoved(id: string): void {
    const pool = this.uploadedAssets().filter((a) => a.id !== id);
    const shots = this.draft().shotList ?? [];
    const hasCascade = shots.some((s) => s.assetRef === id);
    if (hasCascade) {
      // Atomic update — two sequential saveItem calls would race in
      // async transport (the second call reads a pre-first-PUT cache
      // and overwrites the pool back). See store comment.
      const remappedShots = shots.map((s) =>
        s.assetRef === id ? { ...s, assetRef: undefined } : s,
      );
      this.store.setVideoUploadedAssetsAndShotList(pool, remappedShots);
    } else {
      this.store.setVideoUploadedAssets(pool);
    }
  }

  protected onHookBank(): void {
    if (this.disabled() || this.hookBankLoading()) return;
    this.runAssist('post-script-hook', this.hookBankLoading, 3, (values) => {
      this.store.setVideoHookBank(values);
      this.hookBankOpen.set(true);
    });
  }

  protected onApplyHookFromBank(hook: string): void {
    this.store.setVideoHook(hook);
  }

  protected onHideBank(): void {
    this.hookBankOpen.set(false);
  }

  protected onBodyAssist(): void {
    if (this.disabled() || this.bodyAiLoading()) return;
    this.runAssist('post-script-body', this.bodyAiLoading, undefined, (values) => {
      const v = values[0]?.trim();
      if (v) this.store.setVideoBody(v);
    });
  }

  protected onCtaAssist(): void {
    if (this.disabled() || this.ctaAiLoading()) return;
    this.runAssist('post-script-cta', this.ctaAiLoading, undefined, (values) => {
      const v = values[0]?.trim();
      if (v) this.store.setVideoCta(v);
    });
  }

  private runAssist(
    field: AiAssistFieldContract,
    loading: ReturnType<typeof signal<boolean>>,
    count: number | undefined,
    apply: (values: string[]) => void,
  ): void {
    const item = this.store.item();
    const workspaceId = this.contentState.workspaceId();
    if (!item || !workspaceId) return;
    loading.set(true);
    this.aiAssist
      .assist({
        scope: 'content-item',
        workspaceId,
        refId: item.id,
        field,
        ...(count !== undefined ? { count } : {}),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          apply(res.values);
          loading.set(false);
        },
        error: () => {
          this.toast.showError('AI Assist failed. Please try again.');
          loading.set(false);
        },
      });
  }

  protected toggleBRoll(): void {
    this.bRollOpen.update((v) => !v);
  }
  protected toggleVoiceover(): void {
    this.voiceoverOpen.update((v) => !v);
  }
}
