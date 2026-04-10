import { Component, DestroyRef, HostBinding, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type {
  AbAnalysisResult,
  AbScoreBreakdown,
  Platform,
} from '../../strategy-research.types';
import { MockDataService } from '../../../../core/mock-data/mock-data.service';
import {
  AB_GOAL_OPTIONS,
  AB_PLATFORM_OPTIONS,
  AI_SIMULATION_DELAY_MS,
} from '../../strategy-research.constants';
import { MOCK_AB_RESULT } from '../../strategy-research.mock-data';
import { safeTimeout } from '../../strategy-research.utils';
import { DropdownComponent, DropdownOption } from '../../../../shared/dropdown/dropdown.component';

@Component({
  selector: 'app-ab-analyzer',
  imports: [FormsModule, DropdownComponent],
  templateUrl: './ab-analyzer.component.html',
  styleUrl: './ab-analyzer.component.scss',
})
export class AbAnalyzerComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly mockData = inject(MockDataService);

  @HostBinding('class.is-mock-source')
  get isMockSource(): boolean {
    return this.mockData.isMock('ab-analyzer');
  }

  /* v8 ignore start */
  readonly variantA = signal('');
  readonly variantB = signal('');
  readonly selectedGoal = signal<string>(AB_GOAL_OPTIONS[0]);
  readonly selectedPlatform = signal<Platform>('instagram');
  readonly isAnalyzing = signal(false);
  readonly analysis = signal<AbAnalysisResult | null>(null);
  readonly copiedImproved = signal(false);
  readonly ideaTitle = signal('');
  readonly ideaTitleError = signal(false);
  readonly ideaSaved = signal(false);
  /* v8 ignore stop */

  readonly canAnalyze = computed(() =>
    !!this.variantA().trim() && !!this.variantB().trim() && !this.isAnalyzing()
  );

  readonly goalDropdownOptions: DropdownOption[] = AB_GOAL_OPTIONS.map(g => ({ value: g, label: g }));
  readonly platformDropdownOptions: DropdownOption[] = AB_PLATFORM_OPTIONS.map(p => ({ value: p.value, label: p.label }));

  readonly scoreMetrics: { key: keyof AbScoreBreakdown; label: string }[] = [
    { key: 'hookStrength',       label: 'Hook Strength' },
    { key: 'clarity',            label: 'Clarity' },
    { key: 'emotionalResonance', label: 'Emotional Resonance' },
    { key: 'ctaEffectiveness',   label: 'CTA Effectiveness' },
  ];

  updateVariantA(value: string): void { this.variantA.set(value); }
  updateVariantB(value: string): void { this.variantB.set(value); }
  clearVariantA(): void { this.variantA.set(''); }
  clearVariantB(): void { this.variantB.set(''); }

  formatChars(value: string): string {
    return value.length.toLocaleString();
  }

  setGoal(value: string): void { this.selectedGoal.set(value); }
  setPlatform(value: string): void { this.selectedPlatform.set(value as Platform); }

  analyze(): void {
    if (!this.canAnalyze()) return;
    this.isAnalyzing.set(true);
    this.analysis.set(null);
    this.copiedImproved.set(false);
    this.ideaTitle.set('');
    this.ideaTitleError.set(false);
    this.ideaSaved.set(false);
    safeTimeout(() => {
      const cloned: AbAnalysisResult = {
        ...MOCK_AB_RESULT,
        variantA: {
          strengths: [...MOCK_AB_RESULT.variantA.strengths],
          weaknesses: [...MOCK_AB_RESULT.variantA.weaknesses],
        },
        variantB: {
          strengths: [...MOCK_AB_RESULT.variantB.strengths],
          weaknesses: [...MOCK_AB_RESULT.variantB.weaknesses],
        },
        scores: {
          hookStrength:       { ...MOCK_AB_RESULT.scores.hookStrength },
          clarity:            { ...MOCK_AB_RESULT.scores.clarity },
          emotionalResonance: { ...MOCK_AB_RESULT.scores.emotionalResonance },
          ctaEffectiveness:   { ...MOCK_AB_RESULT.scores.ctaEffectiveness },
        },
      };
      this.analysis.set(cloned);
      this.isAnalyzing.set(false);
    }, AI_SIMULATION_DELAY_MS, this.destroyRef);
  }

  copyImproved(): void {
    const result = this.analysis();
    if (!result) return;
    /* v8 ignore next */
    navigator.clipboard?.writeText(result.improvedVersion);
    this.copiedImproved.set(true);
    safeTimeout(() => {
      this.copiedImproved.set(false);
    }, 2000, this.destroyRef);
  }

  useImprovedVersion(): void {
    const result = this.analysis();
    if (result) this.variantA.set(result.improvedVersion);
  }

  setIdeaTitle(value: string): void {
    this.ideaTitle.set(value);
    if (value.trim()) this.ideaTitleError.set(false);
  }

  saveAsIdea(): void {
    if (this.ideaSaved()) return;
    if (!this.ideaTitle().trim()) {
      this.ideaTitleError.set(true);
      return;
    }
    this.ideaSaved.set(true);
  }

  confidenceClass(level: AbAnalysisResult['confidence']): string {
    if (level === 'High') return 'confidence--high';
    if (level === 'Medium') return 'confidence--medium';
    return 'confidence--low';
  }

  winnerCircleClass(letter: 'A' | 'B'): string {
    const w = this.analysis()?.winner;
    if (w === letter) {
      return letter === 'A' ? 'circle--variant-a' : 'circle--variant-b';
    }
    return 'circle--inactive';
  }

  scoreFor(metric: keyof AbScoreBreakdown, side: 'a' | 'b'): number {
    return this.analysis()?.scores[metric][side] ?? 0;
  }

  isWinningSide(side: 'a' | 'b'): boolean {
    const w = this.analysis()?.winner;
    return (w === 'A' && side === 'a') || (w === 'B' && side === 'b');
  }

  scoreBarClass(side: 'a' | 'b'): string {
    const winning = this.isWinningSide(side);
    if (side === 'a') return winning ? 'score-bar--winner-a' : 'score-bar--loser-a';
    return winning ? 'score-bar--winner-b' : 'score-bar--loser-b';
  }

  barWidth(score: number): string {
    return `${(score / 10) * 100}%`;
  }
}
