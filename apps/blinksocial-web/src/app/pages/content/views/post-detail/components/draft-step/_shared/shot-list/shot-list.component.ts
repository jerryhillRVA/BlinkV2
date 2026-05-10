import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type {
  DraftShotItemContract,
  DraftShotItemTypeContract,
} from '@blinksocial/contracts';

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

@Component({
  selector: 'app-shot-list',
  imports: [FormsModule],
  templateUrl: './shot-list.component.html',
  styleUrl: './shot-list.component.scss',
})
export class ShotListComponent {
  @Input() shots: DraftShotItemContract[] = [];
  @Input() disabled = false;

  @Output() shotsChange = new EventEmitter<DraftShotItemContract[]>();

  protected readonly shotTypes = SHOT_TYPES;

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
    const v = (e.target as HTMLInputElement | null)?.value ?? '';
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
}
