import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../../shared/icon/icon.component';
import type { ToneContext } from '../../../strategy-research.types';
import { generateId } from '../../../strategy-research.utils';

const MOCK_TONE_CONTEXTS: ToneContext[] = [
  { id: 'tc1', context: 'Educational', tone: 'Clear, authoritative, relatable', example: 'Here\'s what\'s actually happening in your body during perimenopause — and what you can do about it today.' },
  { id: 'tc2', context: 'Motivational', tone: 'Energetic, affirming, forward-looking', example: 'Your strongest decade might just be the one you\'re stepping into right now.' },
  { id: 'tc3', context: 'Community', tone: 'Warm, conversational, curious', example: 'What\'s been your biggest shift in how you train since turning 40?' },
  { id: 'tc4', context: 'Promotional', tone: 'Honest and benefit-led — never pushy', example: 'We built this program for the woman who knows what she wants but needs the right tools.' },
];

@Component({
  selector: 'app-tone-context',
  imports: [FormsModule, IconComponent],
  templateUrl: './tone-context.component.html',
  styleUrl: './tone-context.component.scss',
})
export class ToneContextComponent {
  readonly toneContexts = signal<ToneContext[]>(MOCK_TONE_CONTEXTS);
  readonly editingId = signal<string | null>(null);
  readonly editTone = signal<ToneContext>({ id: '', context: '', tone: '', example: '' });

  startAdd(): void {
    const newId = generateId('tc');
    this.editingId.set(newId);
    this.editTone.set({ id: newId, context: '', tone: '', example: '' });
  }

  isEditingNew(): boolean {
    const id = this.editingId();
    if (!id) return false;
    return !this.toneContexts().some((t) => t.id === id);
  }

  startEdit(tone: ToneContext): void {
    this.editingId.set(tone.id);
    this.editTone.set({ ...tone });
  }

  save(): void {
    const tone = this.editTone();
    if (!tone.context.trim()) return;
    this.toneContexts.update(list => {
      const exists = list.find(t => t.id === tone.id);
      return exists
        ? list.map(t => t.id === tone.id ? { ...tone } : t)
        : [...list, { ...tone }];
    });
    this.editingId.set(null);
  }

  cancelEdit(): void {
    this.editingId.set(null);
  }

  remove(id: string): void {
    this.toneContexts.update(list => list.filter(t => t.id !== id));
  }

  updateField(field: keyof ToneContext, value: string): void {
    this.editTone.update(t => ({ ...t, [field]: value }));
  }

  generateToneContexts(): void {
    this.toneContexts.set(MOCK_TONE_CONTEXTS);
  }
}
