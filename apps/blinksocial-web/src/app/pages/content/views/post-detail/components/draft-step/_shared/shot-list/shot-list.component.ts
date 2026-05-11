import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type {
  DraftShotItemContract,
  DraftShotItemTypeContract,
} from '@blinksocial/contracts';
import { SectionLabelComponent } from '../section-label/section-label.component';
import { AiButtonComponent } from '../ai-button/ai-button.component';

const SHOT_TYPES: DraftShotItemTypeContract[] = [
  'Shot',
  'B-Roll',
  'Voiceover',
  'Transition',
  'CTA',
];

let nextId = 1;
function newId(): string {
  return `sl-${Date.now().toString(36)}-${nextId++}`;
}

const AI_GENERATED_SHOTS: ReadonlyArray<Pick<DraftShotItemContract, 'type' | 'description' | 'duration'>> = [
  { type: 'Shot', description: 'Hook delivered to camera, eye-level', duration: '5s' },
  { type: 'B-Roll', description: 'Cutaway: hands demonstrating the technique', duration: '8s' },
  { type: 'Shot', description: 'Pivot moment — the surprise insight', duration: '10s' },
  { type: 'B-Roll', description: 'Supporting visual that reinforces the body', duration: '7s' },
  { type: 'CTA', description: 'CTA delivered with eye contact', duration: '5s' },
];

@Component({
  selector: 'app-shot-list',
  imports: [FormsModule, SectionLabelComponent, AiButtonComponent],
  templateUrl: './shot-list.component.html',
  styleUrl: './shot-list.component.scss',
})
export class ShotListComponent {
  @Input() shots: DraftShotItemContract[] = [];
  @Input() coverAssetRef: string | undefined = undefined;
  @Input() disabled = false;

  @Output() shotsChange = new EventEmitter<DraftShotItemContract[]>();
  @Output() coverAssetRefChange = new EventEmitter<string | undefined>();

  protected readonly shotTypes = SHOT_TYPES;
  protected readonly aiLoading = signal(false);

  protected get countLabel(): string {
    const n = this.shots.length;
    return n === 1 ? '1 shot' : `${n} shots`;
  }

  protected onAddShot(): void {
    if (this.disabled) return;
    const next: DraftShotItemContract[] = [
      ...this.shots,
      {
        id: newId(),
        type: 'Shot',
        description: '',
        duration: '',
      },
    ];
    this.shotsChange.emit(next);
  }

  protected onAiGenerate(): void {
    if (this.disabled) return;
    this.aiLoading.set(true);
    // Mock-AI delay so the loading state is visible.
    setTimeout(() => {
      const generated = AI_GENERATED_SHOTS.map((s) => ({
        ...s,
        id: newId(),
      }));
      this.shotsChange.emit([...this.shots, ...generated]);
      this.aiLoading.set(false);
    }, 800);
  }

  protected onRemove(id: string): void {
    if (this.disabled) return;
    this.shotsChange.emit(this.shots.filter((s) => s.id !== id));
  }

  protected onMoveUp(index: number): void {
    if (this.disabled || index === 0) return;
    const next = [...this.shots];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    this.shotsChange.emit(next);
  }

  protected onMoveDown(index: number): void {
    if (this.disabled || index === this.shots.length - 1) return;
    const next = [...this.shots];
    [next[index + 1], next[index]] = [next[index], next[index + 1]];
    this.shotsChange.emit(next);
  }

  protected onTypeChange(id: string, e: Event): void {
    if (this.disabled) return;
    const v = (e.target as HTMLSelectElement | null)?.value as
      | DraftShotItemTypeContract
      | undefined;
    if (!v) return;
    this.patch(id, { type: v });
  }

  protected onDescriptionChange(id: string, e: Event): void {
    if (this.disabled) return;
    const v = (e.target as HTMLTextAreaElement | null)?.value ?? '';
    this.patch(id, { description: v });
  }

  protected onDurationChange(id: string, e: Event): void {
    if (this.disabled) return;
    const v = (e.target as HTMLInputElement | null)?.value ?? '';
    this.patch(id, { duration: v });
  }

  private patch(id: string, patch: Partial<DraftShotItemContract>): void {
    this.shotsChange.emit(
      this.shots.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    );
  }

  // ── Top-level cover-asset attach/clear ────────────────────────────

  protected onCoverFile(e: Event): void {
    if (this.disabled) return;
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.coverAssetRefChange.emit(file.name);
  }

  protected onCoverClear(): void {
    if (this.disabled) return;
    this.coverAssetRefChange.emit(undefined);
  }

  // ── Per-shot asset attach/AI-create/clear ─────────────────────────

  protected onShotFile(id: string, e: Event): void {
    if (this.disabled) return;
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.patch(id, { assetRef: file.name });
  }

  protected onShotAssetClear(id: string): void {
    if (this.disabled) return;
    this.patch(id, { assetRef: undefined });
  }
}
