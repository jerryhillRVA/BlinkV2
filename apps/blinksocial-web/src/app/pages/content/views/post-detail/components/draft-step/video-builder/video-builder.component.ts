import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { DraftShotItemContract } from '@blinksocial/contracts';
import { PostDetailStore } from '../../../post-detail.store';
import { ShotListComponent } from '../_shared/shot-list/shot-list.component';

const TARGET_DURATIONS = ['15s', '30s', '60s', '90s', '2m', '3m'] as const;

const HOOK_BANK_STUB = [
  'Stop scrolling — this changes everything.',
  'I wish I knew this 10 years ago.',
  'Three minutes today, a different body tomorrow.',
  'Read this if you ever wake up tight.',
];

@Component({
  selector: 'app-video-builder',
  imports: [FormsModule, ShotListComponent],
  templateUrl: './video-builder.component.html',
  styleUrl: './video-builder.component.scss',
})
export class VideoBuilderComponent {
  protected readonly store = inject(PostDetailStore);

  protected readonly draft = this.store.videoDraft;
  protected readonly disabled = computed(
    () => !this.store.item()?.briefApproved,
  );

  protected readonly hookBankOpen = signal(false);
  protected readonly bRollOpen = signal(false);
  protected readonly voiceoverOpen = signal(false);

  protected readonly durations = TARGET_DURATIONS;

  protected get duration(): string {
    return this.draft().targetDuration ?? '60s';
  }

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
    this.store.setVideoBRollNotes(
      (e.target as HTMLTextAreaElement).value ?? '',
    );
  }
  protected onVoiceoverInput(e: Event): void {
    this.store.setVideoVoiceoverNotes(
      (e.target as HTMLTextAreaElement).value ?? '',
    );
  }
  protected onDurationChange(e: Event): void {
    this.store.setVideoTargetDuration(
      (e.target as HTMLSelectElement).value ?? '60s',
    );
  }

  protected onShotsChange(shots: DraftShotItemContract[]): void {
    this.store.setVideoShotList(shots);
  }

  protected onHookAssist(): void {
    if (this.disabled()) return;
    this.store.setVideoHook(
      'Your body shouldn’t feel 80 when you’re 40.',
    );
  }

  protected onBodyAssist(): void {
    if (this.disabled()) return;
    this.store.setVideoBody(
      'Three minutes a day. No equipment. Five gentle moves that wake your spine and hips before coffee.',
    );
  }

  protected onCtaAssist(): void {
    if (this.disabled()) return;
    this.store.setVideoCta('Save this — your tomorrow self will thank you.');
  }

  protected onGenerateHookBank(): void {
    if (this.disabled()) return;
    this.store.setVideoHookBank(HOOK_BANK_STUB);
    this.hookBankOpen.set(true);
  }

  protected onApplyHookFromBank(hook: string): void {
    this.store.setVideoHook(hook);
  }

  protected toggleBRoll(): void {
    this.bRollOpen.update((v) => !v);
  }
  protected toggleVoiceover(): void {
    this.voiceoverOpen.update((v) => !v);
  }
  protected toggleHookBank(): void {
    this.hookBankOpen.update((v) => !v);
  }
}
