import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

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
  readonly vocabulary = signal<{ preferred: string[]; avoid: string[] }>({ preferred: [], avoid: [] });
  readonly newPreferredWord = signal('');
  readonly newAvoidWord = signal('');

  addPreferredWord(): void {
    const word = this.newPreferredWord().trim();
    if (!word) return;
    this.vocabulary.update(v => ({ ...v, preferred: [...v.preferred, word] }));
    this.newPreferredWord.set('');
  }

  removePreferredWord(word: string): void {
    this.vocabulary.update(v => ({ ...v, preferred: v.preferred.filter(w => w !== word) }));
  }

  addAvoidWord(): void {
    const word = this.newAvoidWord().trim();
    if (!word) return;
    this.vocabulary.update(v => ({ ...v, avoid: [...v.avoid, word] }));
    this.newAvoidWord.set('');
  }

  removeAvoidWord(word: string): void {
    this.vocabulary.update(v => ({ ...v, avoid: v.avoid.filter(w => w !== word) }));
  }

  generateVocabulary(): void {
    this.vocabulary.update(v => ({
      preferred: [...new Set([...v.preferred, ...MOCK_VOCAB.preferred])],
      avoid: [...new Set([...v.avoid, ...MOCK_VOCAB.avoid])],
    }));
  }
}
