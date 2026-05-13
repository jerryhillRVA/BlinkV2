import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { DraftShotItemContract } from '@blinksocial/contracts';
import { PostDetailStore } from '../../../post-detail.store';
import { ShotListComponent } from '../_shared/shot-list/shot-list.component';
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

const HOOK_BANK_STUB = [
  'Most people get this completely wrong — here\'s what actually works.',
  'If you\'ve ever felt stuck on this, you\'re not alone — and the fix is simpler than you think.',
  'Stop scrolling. This 30-second tip will change how you approach this forever.',
];

@Component({
  selector: 'app-video-builder',
  imports: [
    FormsModule,
    ShotListComponent,
    SectionLabelComponent,
    AiButtonComponent,
    PillGroupComponent,
  ],
  templateUrl: './video-builder.component.html',
  styleUrl: './video-builder.component.scss',
})
export class VideoBuilderComponent {
  protected readonly store = inject(PostDetailStore);

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

  protected onCoverAssetRefChange(v: string | undefined): void {
    this.store.setVideoCoverAssetRef(v);
  }

  protected onHookBank(): void {
    if (this.disabled()) return;
    this.hookBankLoading.set(true);
    // Simulate the prototype's mock-AI delay so the loading state is visible
    // and the focus/state stays predictable.
    setTimeout(() => {
      this.store.setVideoHookBank(HOOK_BANK_STUB);
      this.hookBankOpen.set(true);
      this.hookBankLoading.set(false);
    }, 600);
  }

  protected onApplyHookFromBank(hook: string): void {
    this.store.setVideoHook(hook);
  }

  protected onHideBank(): void {
    this.hookBankOpen.set(false);
  }

  protected onBodyAssist(): void {
    if (this.disabled()) return;
    this.bodyAiLoading.set(true);
    setTimeout(() => {
      this.store.setVideoBody(
        'Step 1: Start with the core principle — it’s simpler than you think.\n\nStep 2: Apply it consistently for at least 14 days before judging the results.\n\nStep 3: Track your progress and adjust as you learn what works.',
      );
      this.bodyAiLoading.set(false);
    }, 600);
  }

  protected onCtaAssist(): void {
    if (this.disabled()) return;
    this.ctaAiLoading.set(true);
    setTimeout(() => {
      this.store.setVideoCta('Save this for later and share it with someone who needs it. 👇');
      this.ctaAiLoading.set(false);
    }, 600);
  }

  protected toggleBRoll(): void {
    this.bRollOpen.update((v) => !v);
  }
  protected toggleVoiceover(): void {
    this.voiceoverOpen.update((v) => !v);
  }
}
