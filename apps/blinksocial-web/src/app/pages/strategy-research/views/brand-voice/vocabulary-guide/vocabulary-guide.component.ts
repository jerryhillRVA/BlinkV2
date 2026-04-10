import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../../../core/toast/toast.service';
import { StrategyResearchStateService } from '../../../strategy-research-state.service';

const MOCK_VOCAB = {
  preferred: ['perimenopause', 'hormonal shift', 'movement', 'reclaim', 'adapt', 'community', 'evidence-backed', 'sustainable'],
  avoid: ['anti-aging', 'fight', 'battle', 'fix your body', 'before & after', 'dramatic results'],
};

@Component({
  selector: 'app-vocabulary-guide',
  imports: [FormsModule],
  templateUrl: './vocabulary-guide.component.html',
  styleUrl: './vocabulary-guide.component.scss',
})
export class VocabularyGuideComponent {
  private readonly toast = inject(ToastService);
  private readonly stateService = inject(StrategyResearchStateService);

  readonly vocabulary = computed(() => this.stateService.brandVoice().vocabulary);
  readonly newPreferredWord = signal('');
  readonly newAvoidWord = signal('');

  addPreferredWord(): void {
    const word = this.newPreferredWord().trim();
    if (!word) return;
    this.stateService.brandVoice.update(bv => ({
      ...bv,
      vocabulary: { ...bv.vocabulary, preferred: [...bv.vocabulary.preferred, word] },
    }));
    this.stateService.saveBrandVoice(this.stateService.brandVoice());
    this.toast.showSuccess('Preferred word added');
    this.newPreferredWord.set('');
  }

  removePreferredWord(word: string): void {
    this.stateService.brandVoice.update(bv => ({
      ...bv,
      vocabulary: { ...bv.vocabulary, preferred: bv.vocabulary.preferred.filter(w => w !== word) },
    }));
    this.stateService.saveBrandVoice(this.stateService.brandVoice());
    this.toast.showSuccess('Word removed');
  }

  addAvoidWord(): void {
    const word = this.newAvoidWord().trim();
    if (!word) return;
    this.stateService.brandVoice.update(bv => ({
      ...bv,
      vocabulary: { ...bv.vocabulary, avoid: [...bv.vocabulary.avoid, word] },
    }));
    this.stateService.saveBrandVoice(this.stateService.brandVoice());
    this.toast.showSuccess('Avoid word added');
    this.newAvoidWord.set('');
  }

  removeAvoidWord(word: string): void {
    this.stateService.brandVoice.update(bv => ({
      ...bv,
      vocabulary: { ...bv.vocabulary, avoid: bv.vocabulary.avoid.filter(w => w !== word) },
    }));
    this.stateService.saveBrandVoice(this.stateService.brandVoice());
    this.toast.showSuccess('Word removed');
  }

  generateVocabulary(): void {
    const current = this.stateService.brandVoice().vocabulary;
    this.stateService.brandVoice.update(bv => ({
      ...bv,
      vocabulary: {
        preferred: [...new Set([...current.preferred, ...MOCK_VOCAB.preferred])],
        avoid: [...new Set([...current.avoid, ...MOCK_VOCAB.avoid])],
      },
    }));
    this.stateService.saveBrandVoice(this.stateService.brandVoice());
    this.toast.showSuccess('Vocabulary generated');
  }
}
