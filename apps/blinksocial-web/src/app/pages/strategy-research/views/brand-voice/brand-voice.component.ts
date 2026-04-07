import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type {
  BrandVoiceData,
  VoiceAttribute,
  ToneContext,
  Platform,
} from '../../strategy-research.types';

const MOCK_VOICE_ATTRIBUTES: VoiceAttribute[] = [
  { id: 'va1', label: 'Empowering', description: 'We lift women up, never talk down to them.', doExample: 'You have everything it takes — let\'s unlock it together.', dontExample: 'You need to fix your relationship with your body.' },
  { id: 'va2', label: 'Knowledgeable but Accessible', description: 'Expert-backed but never jargon-heavy.', doExample: 'Estrogen affects your muscle recovery — here\'s what that means for your workouts.', dontExample: 'HRT-mediated myofibrillar protein synthesis rates indicate...' },
  { id: 'va3', label: 'Warm & Inclusive', description: 'Every woman in her 40s belongs here.', doExample: 'Whether you\'re a lifelong athlete or just rediscovering movement — this is your space.', dontExample: 'For women who are already committed to fitness.' },
  { id: 'va4', label: 'Honest & Real', description: 'No toxic positivity, no impossible standards.', doExample: 'Some days perimenopause wins. That\'s real. Here\'s how to adapt.', dontExample: 'Every day is an opportunity to crush it!' },
];

const MOCK_TONE_CONTEXTS: ToneContext[] = [
  { id: 'tc1', context: 'Educational', tone: 'Clear, authoritative, relatable', example: 'Here\'s what\'s actually happening in your body during perimenopause — and what you can do about it today.' },
  { id: 'tc2', context: 'Motivational', tone: 'Energetic, affirming, forward-looking', example: 'Your strongest decade might just be the one you\'re stepping into right now.' },
  { id: 'tc3', context: 'Community', tone: 'Warm, conversational, curious', example: 'What\'s been your biggest shift in how you train since turning 40?' },
  { id: 'tc4', context: 'Promotional', tone: 'Honest and benefit-led — never pushy', example: 'We built this program for the woman who knows what she wants but needs the right tools.' },
];

const MOCK_VOCAB = {
  preferred: ['perimenopause', 'hormonal shift', 'movement', 'reclaim', 'adapt', 'community', 'evidence-backed', 'sustainable'],
  avoid: ['anti-aging', 'fight', 'battle', 'fix your body', 'before & after', 'dramatic results'],
};

const MOCK_PLATFORM_SUGGESTIONS: Record<string, string> = {
  instagram: 'Warm, visual storytelling. Use emojis sparingly. Captions can be medium-length with a strong hook.',
  tiktok: 'Fast-paced and conversational — mirror trending audio language. Hook within 2 seconds.',
  youtube: 'Thorough and evidence-backed. Viewers opt in for depth — reward them with real value.',
  facebook: 'Community-first. Ask questions, celebrate wins, invite discussion.',
  linkedin: 'Professional but human — share expertise with personal context.',
};

const ALL_PLATFORMS: Platform[] = ['instagram', 'tiktok', 'youtube', 'facebook', 'linkedin'];

@Component({
  selector: 'app-brand-voice',
  imports: [CommonModule, FormsModule],
  templateUrl: './brand-voice.component.html',
  styleUrl: './brand-voice.component.scss',
})
export class BrandVoiceComponent {
  readonly data = signal<BrandVoiceData>({
    missionStatement: '',
    voiceAttributes: [],
    toneByContext: [],
    platformToneAdjustments: ALL_PLATFORMS.map(p => ({ platform: p, adjustment: '' })),
    vocabulary: { preferred: [], avoid: [] },
  });

  readonly isDraftingMission = signal(false);
  readonly isGeneratingAttributes = signal(false);
  readonly suggestingPlatform = signal<Platform | null>(null);

  // Editing state for voice attributes
  readonly editingAttributeId = signal<string | null>(null);
  readonly editAttribute = signal<VoiceAttribute>({ id: '', label: '', description: '', doExample: '', dontExample: '' });

  // Editing state for tone contexts
  readonly editingToneId = signal<string | null>(null);
  readonly editTone = signal<ToneContext>({ id: '', context: '', tone: '', example: '' });

  // Vocab input state
  readonly newPreferredWord = signal('');
  readonly newAvoidWord = signal('');

  readonly platformLabels: Record<Platform, string> = {
    instagram: 'Instagram',
    tiktok: 'TikTok',
    youtube: 'YouTube',
    facebook: 'Facebook',
    linkedin: 'LinkedIn',
  };

  // --- Mission Statement ---

  draftMission(): void {
    this.isDraftingMission.set(true);
    setTimeout(() => {
      this.data.update(d => ({
        ...d,
        missionStatement: 'Empower women over 40 to reclaim their strength, vitality, and confidence through evidence-backed fitness, nutrition, and community — because your best years are not behind you.',
      }));
      this.isDraftingMission.set(false);
    }, 2000);
  }

  updateMission(value: string): void {
    this.data.update(d => ({ ...d, missionStatement: value }));
  }

  // --- Voice Attributes ---

  generateAttributes(): void {
    this.isGeneratingAttributes.set(true);
    setTimeout(() => {
      this.data.update(d => ({ ...d, voiceAttributes: [...d.voiceAttributes, ...MOCK_VOICE_ATTRIBUTES] }));
      this.isGeneratingAttributes.set(false);
    }, 2000);
  }

  startAddAttribute(): void {
    const newId = `va-${Date.now()}`;
    this.editingAttributeId.set(newId);
    this.editAttribute.set({ id: newId, label: '', description: '', doExample: '', dontExample: '' });
  }

  startEditAttribute(attr: VoiceAttribute): void {
    this.editingAttributeId.set(attr.id);
    this.editAttribute.set({ ...attr });
  }

  saveAttribute(): void {
    const attr = this.editAttribute();
    if (!attr.label.trim()) return;
    this.data.update(d => {
      const exists = d.voiceAttributes.find(a => a.id === attr.id);
      const voiceAttributes = exists
        ? d.voiceAttributes.map(a => a.id === attr.id ? { ...attr } : a)
        : [...d.voiceAttributes, { ...attr }];
      return { ...d, voiceAttributes };
    });
    this.editingAttributeId.set(null);
  }

  cancelEditAttribute(): void {
    this.editingAttributeId.set(null);
  }

  removeAttribute(id: string): void {
    this.data.update(d => ({
      ...d,
      voiceAttributes: d.voiceAttributes.filter(a => a.id !== id),
    }));
  }

  // --- Tone by Context ---

  startAddTone(): void {
    const newId = `tc-${Date.now()}`;
    this.editingToneId.set(newId);
    this.editTone.set({ id: newId, context: '', tone: '', example: '' });
  }

  startEditTone(tone: ToneContext): void {
    this.editingToneId.set(tone.id);
    this.editTone.set({ ...tone });
  }

  saveTone(): void {
    const tone = this.editTone();
    if (!tone.context.trim()) return;
    this.data.update(d => {
      const exists = d.toneByContext.find(t => t.id === tone.id);
      const toneByContext = exists
        ? d.toneByContext.map(t => t.id === tone.id ? { ...tone } : t)
        : [...d.toneByContext, { ...tone }];
      return { ...d, toneByContext };
    });
    this.editingToneId.set(null);
  }

  cancelEditTone(): void {
    this.editingToneId.set(null);
  }

  updateEditAttributeField(field: keyof VoiceAttribute, value: string): void {
    this.editAttribute.update(a => ({ ...a, [field]: value }));
  }

  updateEditToneField(field: keyof ToneContext, value: string): void {
    this.editTone.update(t => ({ ...t, [field]: value }));
  }

  removeTone(id: string): void {
    this.data.update(d => ({
      ...d,
      toneByContext: d.toneByContext.filter(t => t.id !== id),
    }));
  }

  generateToneContexts(): void {
    this.data.update(d => ({ ...d, toneByContext: MOCK_TONE_CONTEXTS }));
  }

  // --- Platform Tone Adjustments ---

  updatePlatformAdjustment(platform: Platform, value: string): void {
    this.data.update(d => ({
      ...d,
      platformToneAdjustments: d.platformToneAdjustments.map(p =>
        p.platform === platform ? { ...p, adjustment: value } : p
      ),
    }));
  }

  suggestPlatformTone(platform: Platform): void {
    this.suggestingPlatform.set(platform);
    setTimeout(() => {
      const suggestion = MOCK_PLATFORM_SUGGESTIONS[platform] ?? '';
      this.updatePlatformAdjustment(platform, suggestion);
      this.suggestingPlatform.set(null);
    }, 1500);
  }

  // --- Vocabulary ---

  addPreferredWord(): void {
    const word = this.newPreferredWord().trim();
    if (!word) return;
    this.data.update(d => ({
      ...d,
      vocabulary: { ...d.vocabulary, preferred: [...d.vocabulary.preferred, word] },
    }));
    this.newPreferredWord.set('');
  }

  removePreferredWord(word: string): void {
    this.data.update(d => ({
      ...d,
      vocabulary: { ...d.vocabulary, preferred: d.vocabulary.preferred.filter(w => w !== word) },
    }));
  }

  addAvoidWord(): void {
    const word = this.newAvoidWord().trim();
    if (!word) return;
    this.data.update(d => ({
      ...d,
      vocabulary: { ...d.vocabulary, avoid: [...d.vocabulary.avoid, word] },
    }));
    this.newAvoidWord.set('');
  }

  removeAvoidWord(word: string): void {
    this.data.update(d => ({
      ...d,
      vocabulary: { ...d.vocabulary, avoid: d.vocabulary.avoid.filter(w => w !== word) },
    }));
  }

  generateVocabulary(): void {
    this.data.update(d => ({
      ...d,
      vocabulary: {
        preferred: [...new Set([...d.vocabulary.preferred, ...MOCK_VOCAB.preferred])],
        avoid: [...new Set([...d.vocabulary.avoid, ...MOCK_VOCAB.avoid])],
      },
    }));
  }
}
