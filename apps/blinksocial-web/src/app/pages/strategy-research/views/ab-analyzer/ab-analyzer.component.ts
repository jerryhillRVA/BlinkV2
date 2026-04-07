import { Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { Platform } from '../../strategy-research.types';
import { PLATFORM_OPTIONS, AB_GOAL_OPTIONS, AI_SIMULATION_DELAY_MS } from '../../strategy-research.constants';
import { safeTimeout } from '../../strategy-research.utils';

interface ScoreBreakdown {
  hookStrength: { a: number; b: number };
  clarity: { a: number; b: number };
  emotionalResonance: { a: number; b: number };
  ctaEffectiveness: { a: number; b: number };
}

interface AnalysisResult {
  winner: 'A' | 'B';
  confidence: string;
  verdict: string;
  variantA: { strengths: string[]; weaknesses: string[] };
  variantB: { strengths: string[]; weaknesses: string[] };
  scores: ScoreBreakdown;
  improvedVersion: string;
}

const MOCK_ANALYSIS: AnalysisResult = {
  winner: 'A',
  confidence: 'High',
  verdict: 'Variant A leads with stronger emotional connection and clearer CTA.',
  variantA: { strengths: ['Strong emotional hook', 'Clear benefit statement'], weaknesses: ['CTA could be more specific'] },
  variantB: { strengths: ['Good use of social proof'], weaknesses: ['Weak opening', 'Vague CTA'] },
  scores: {
    hookStrength: { a: 8, b: 5 },
    clarity: { a: 9, b: 6 },
    emotionalResonance: { a: 8, b: 4 },
    ctaEffectiveness: { a: 7, b: 5 },
  },
  improvedVersion: 'Your strongest decade starts now. Join 2,000+ women who\'ve reclaimed their energy, strength, and confidence after 40. Start your free 7-day movement plan today.',
};


@Component({
  selector: 'app-ab-analyzer',
  imports: [CommonModule, FormsModule],
  templateUrl: './ab-analyzer.component.html',
  styleUrl: './ab-analyzer.component.scss',
})
export class AbAnalyzerComponent {
  private readonly destroyRef = inject(DestroyRef);

  readonly variantA = signal('');
  readonly variantB = signal('');
  readonly isAnalyzing = signal(false);
  readonly analysis = signal<AnalysisResult | null>(null);

  selectedGoal = AB_GOAL_OPTIONS[0];
  selectedPlatform: Platform = 'instagram';

  readonly goalOptions = AB_GOAL_OPTIONS;
  readonly platformOptions = PLATFORM_OPTIONS;

  readonly scoreMetrics: { key: keyof ScoreBreakdown; label: string }[] = [
    { key: 'hookStrength', label: 'Hook Strength' },
    { key: 'clarity', label: 'Clarity' },
    { key: 'emotionalResonance', label: 'Emotional Resonance' },
    { key: 'ctaEffectiveness', label: 'CTA Effectiveness' },
  ];

  updateVariantA(value: string): void {
    this.variantA.set(value);
  }

  updateVariantB(value: string): void {
    this.variantB.set(value);
  }

  analyze(): void {
    if (!this.variantA().trim() || !this.variantB().trim()) return;
    this.isAnalyzing.set(true);
    this.analysis.set(null);
    safeTimeout(() => {
      this.analysis.set(MOCK_ANALYSIS);
      this.isAnalyzing.set(false);
    }, AI_SIMULATION_DELAY_MS, this.destroyRef);
  }

  getBarWidth(score: number): string {
    return `${(score / 10) * 100}%`;
  }

  useImprovedVersion(): void {
    const result = this.analysis();
    if (result) {
      this.variantA.set(result.improvedVersion);
    }
  }
}
