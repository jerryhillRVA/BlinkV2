import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type {
  DraftSequenceBlockContract,
  DraftSequenceBlockTypeContract,
} from '@blinksocial/contracts';
import { PostDetailStore } from '../../../post-detail.store';

const SEQUENCE_TYPES: DraftSequenceBlockTypeContract[] = [
  'Hook',
  'Body',
  'Section',
  'CTA',
];

const TARGET_DURATIONS = ['3m', '5m', '10m', '15m', '20m+'] as const;

let nextId = 1;
const newId = () => `sb-${Date.now().toString(36)}-${nextId++}`;

@Component({
  selector: 'app-video-long-builder',
  imports: [FormsModule],
  templateUrl: './video-long-builder.component.html',
  styleUrl: './video-long-builder.component.scss',
})
export class VideoLongBuilderComponent {
  protected readonly store = inject(PostDetailStore);

  protected readonly draft = this.store.videoLongDraft;
  protected readonly disabled = computed(
    () => !this.store.item()?.briefApproved,
  );

  /* v8 ignore next — signal() default-value branch unreachable from TestBed */
  protected readonly voiceoverOpen = signal(false);
  protected readonly types = SEQUENCE_TYPES;
  protected readonly durations = TARGET_DURATIONS;

  protected get duration(): string {
    return this.draft().targetDuration ?? '10m';
  }

  protected onHookInput(e: Event): void {
    this.store.setVideoLongHook((e.target as HTMLTextAreaElement).value ?? '');
  }

  protected onHookAssist(): void {
    if (this.disabled()) return;
    this.store.setVideoLongHook(
      'In the next 10 minutes, we’ll cover what no one taught you about sleep.',
    );
  }

  protected onDurationChange(e: Event): void {
    this.store.setVideoLongTargetDuration(
      (e.target as HTMLSelectElement).value ?? '10m',
    );
  }

  protected onVoiceoverInput(e: Event): void {
    this.store.setVideoLongVoiceoverNotes(
      (e.target as HTMLTextAreaElement).value ?? '',
    );
  }

  protected toggleVoiceover(): void {
    this.voiceoverOpen.update((v) => !v);
  }

  protected onAddBlock(): void {
    if (this.disabled()) return;
    const next: DraftSequenceBlockContract[] = [
      ...(this.draft().sequenceBlocks ?? []),
      { id: newId(), type: 'Body', description: '', duration: '' },
    ];
    this.store.setVideoLongSequenceBlocks(next);
  }

  protected onRemoveBlock(id: string): void {
    if (this.disabled()) return;
    this.store.setVideoLongSequenceBlocks(
      (this.draft().sequenceBlocks ?? []).filter((b) => b.id !== id),
    );
  }

  protected onMoveUp(i: number): void {
    if (this.disabled() || i === 0) return;
    const list = [...(this.draft().sequenceBlocks ?? [])];
    [list[i - 1], list[i]] = [list[i], list[i - 1]];
    this.store.setVideoLongSequenceBlocks(list);
  }

  protected onMoveDown(i: number): void {
    const list = this.draft().sequenceBlocks ?? [];
    if (this.disabled() || i === list.length - 1) return;
    const next = [...list];
    [next[i + 1], next[i]] = [next[i], next[i + 1]];
    this.store.setVideoLongSequenceBlocks(next);
  }

  protected onBlockType(id: string, e: Event): void {
    if (this.disabled()) return;
    const v = (e.target as HTMLSelectElement)
      .value as DraftSequenceBlockTypeContract;
    this.patchBlock(id, { type: v });
  }

  protected onBlockDescription(id: string, e: Event): void {
    if (this.disabled()) return;
    this.patchBlock(id, {
      description: (e.target as HTMLInputElement).value ?? '',
    });
  }

  protected onBlockDuration(id: string, e: Event): void {
    if (this.disabled()) return;
    this.patchBlock(id, {
      duration: (e.target as HTMLInputElement).value ?? '',
    });
  }

  private patchBlock(
    id: string,
    patch: Partial<DraftSequenceBlockContract>,
  ): void {
    this.store.setVideoLongSequenceBlocks(
      (this.draft().sequenceBlocks ?? []).map((b) =>
        b.id === id ? { ...b, ...patch } : b,
      ),
    );
  }
}
