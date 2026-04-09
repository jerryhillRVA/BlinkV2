import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../../shared/icon/icon.component';
import type { VoiceAttribute } from '../../../strategy-research.types';
import { AI_SIMULATION_DELAY_MS } from '../../../strategy-research.constants';
import { safeTimeout, generateId } from '../../../strategy-research.utils';

const MOCK_VOICE_ATTRIBUTES: VoiceAttribute[] = [
  { id: 'va1', label: 'Empowering', description: 'We lift women up, never talk down to them.', doExample: 'You have everything it takes — let\'s unlock it together.', dontExample: 'You need to fix your relationship with your body.' },
  { id: 'va2', label: 'Knowledgeable but Accessible', description: 'Expert-backed but never jargon-heavy.', doExample: 'Estrogen affects your muscle recovery — here\'s what that means for your workouts.', dontExample: 'HRT-mediated myofibrillar protein synthesis rates indicate...' },
  { id: 'va3', label: 'Warm & Inclusive', description: 'Every woman in her 40s belongs here.', doExample: 'Whether you\'re a lifelong athlete or just rediscovering movement — this is your space.', dontExample: 'For women who are already committed to fitness.' },
  { id: 'va4', label: 'Honest & Real', description: 'No toxic positivity, no impossible standards.', doExample: 'Some days perimenopause wins. That\'s real. Here\'s how to adapt.', dontExample: 'Every day is an opportunity to crush it!' },
];

@Component({
  selector: 'app-voice-attributes',
  imports: [FormsModule, IconComponent],
  templateUrl: './voice-attributes.component.html',
  styleUrl: './voice-attributes.component.scss',
})
export class VoiceAttributesComponent {
  private readonly destroyRef = inject(DestroyRef);

  readonly attributes = signal<VoiceAttribute[]>(MOCK_VOICE_ATTRIBUTES);
  readonly isGenerating = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly editAttribute = signal<VoiceAttribute>({ id: '', label: '', description: '', doExample: '', dontExample: '' });

  generateAttributes(): void {
    this.isGenerating.set(true);
    safeTimeout(() => {
      this.attributes.update(attrs => [...attrs, ...MOCK_VOICE_ATTRIBUTES]);
      this.isGenerating.set(false);
    }, AI_SIMULATION_DELAY_MS, this.destroyRef);
  }

  startAdd(): void {
    const newId = generateId('va');
    this.editingId.set(newId);
    this.editAttribute.set({ id: newId, label: '', description: '', doExample: '', dontExample: '' });
  }

  isEditingNew(): boolean {
    const id = this.editingId();
    if (!id) return false;
    return !this.attributes().some((a) => a.id === id);
  }

  startEdit(attr: VoiceAttribute): void {
    this.editingId.set(attr.id);
    this.editAttribute.set({ ...attr });
  }

  save(): void {
    const attr = this.editAttribute();
    if (!attr.label.trim()) return;
    this.attributes.update(attrs => {
      const exists = attrs.find(a => a.id === attr.id);
      return exists
        ? attrs.map(a => a.id === attr.id ? { ...attr } : a)
        : [...attrs, { ...attr }];
    });
    this.editingId.set(null);
  }

  cancelEdit(): void {
    this.editingId.set(null);
  }

  remove(id: string): void {
    this.attributes.update(attrs => attrs.filter(a => a.id !== id));
  }

  updateField(field: keyof VoiceAttribute, value: string): void {
    this.editAttribute.update(a => ({ ...a, [field]: value }));
  }
}
