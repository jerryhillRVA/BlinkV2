import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { type Platform } from '../../strategy-research.types';

interface RepurposedOutput {
  platform: Platform;
  format: string;
  content: string;
}

const PLATFORM_OPTIONS: { id: Platform; label: string }[] = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'facebook', label: 'Facebook' },
];

const MOCK_OUTPUTS: RepurposedOutput[] = [
  { platform: 'instagram', format: 'Carousel', content: 'Slide 1: Your strongest decade starts NOW.\nSlide 2: 3 movements that changed everything for women 40+\nSlide 3: Wall push-ups - 10 reps\nSlide 4: Chair squats - 12 reps\nSlide 5: Band pulls - 15 reps\nSlide 6: Start your free 7-day plan (link in bio)' },
  { platform: 'tiktok', format: 'Short Video Script', content: 'Hook: "I\'m 47 and stronger than I was at 27"\n\n[Show workout montage]\n\nVoiceover: These 3 exercises changed my life after 40...\n\n1. Wall push-ups for upper body\n2. Chair squats for legs\n3. Band pulls for posture\n\nCTA: Follow for your free 7-day plan!' },
  { platform: 'youtube', format: 'Community Post', content: 'Quick poll for my 40+ community:\n\nWhat\'s your biggest fitness challenge right now?\n\nA) Finding time\nB) Knowing what exercises to do\nC) Staying motivated\nD) Joint pain/limitations\n\nDrop your answer below - I\'m creating content based on YOUR needs!' },
  { platform: 'linkedin', format: 'Text Post', content: 'At 40, I thought my best fitness years were behind me.\n\nAt 47, I\'m proving that wrong every single day.\n\nHere\'s what I\'ve learned about building strength in midlife:\n\n- Start where you are, not where you think you should be\n- Consistency beats intensity every time\n- Your body is more resilient than you think\n\n2,000+ women have joined our community. The results speak for themselves.\n\n#FitnessOver40 #MidlifeStrength #WomenInWellness' },
];

@Component({
  selector: 'app-content-repurposer',
  imports: [CommonModule, FormsModule],
  templateUrl: './content-repurposer.component.html',
  styleUrl: './content-repurposer.component.scss',
})
export class ContentRepurposerComponent {
  readonly sourceContent = signal('');
  readonly selectedPlatforms = signal<Set<Platform>>(new Set(['instagram', 'tiktok']));
  readonly isGenerating = signal(false);
  readonly outputs = signal<RepurposedOutput[]>([]);
  readonly copiedIndex = signal<number | null>(null);

  readonly platformOptions = PLATFORM_OPTIONS;

  isPlatformSelected(platform: Platform): boolean {
    return this.selectedPlatforms().has(platform);
  }

  togglePlatform(platform: Platform): void {
    this.selectedPlatforms.update(set => {
      const next = new Set(set);
      if (next.has(platform)) {
        next.delete(platform);
      } else {
        next.add(platform);
      }
      return next;
    });
  }

  repurpose(): void {
    if (!this.sourceContent().trim()) return;
    this.isGenerating.set(true);
    this.outputs.set([]);
    setTimeout(() => {
      const selected = this.selectedPlatforms();
      const filtered = MOCK_OUTPUTS.filter(o => selected.has(o.platform));
      this.outputs.set(filtered.length > 0 ? filtered : MOCK_OUTPUTS.slice(0, 2));
      this.isGenerating.set(false);
    }, 2500);
  }

  copyContent(index: number): void {
    const output = this.outputs()[index];
    if (output) {
      navigator.clipboard?.writeText(output.content);
      this.copiedIndex.set(index);
      setTimeout(() => this.copiedIndex.set(null), 2000);
    }
  }

  saveAsIdea(_index: number): void {
    // placeholder
  }

  updateSource(value: string): void {
    this.sourceContent.set(value);
  }
}
