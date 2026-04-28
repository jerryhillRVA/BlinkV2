import { Component, DestroyRef, computed, effect, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DropdownComponent, DropdownOption } from '../../../../../shared/dropdown/dropdown.component';
import { PlatformIconComponent } from '../../../../../shared/platform-icon/platform-icon.component';
import { StrategyResearchStateService } from '../../../strategy-research-state.service';
import { ToastService } from '../../../../../core/toast/toast.service';
import type {
  OutreachFormat,
  Platform,
  ShortlistedInfluencer,
} from '../../../strategy-research.types';
import {
  AI_SIMULATION_DELAY_MS,
  OBJECTIVE_CATEGORY_CONFIG,
  OUTREACH_FORMAT_OPTIONS,
  PLATFORM_LABELS,
} from '../../../strategy-research.constants';
import { safeTimeout } from '../../../strategy-research.utils';

@Component({
  selector: 'app-influencer-outreach-tab',
  imports: [CommonModule, FormsModule, DropdownComponent, PlatformIconComponent],
  templateUrl: './outreach-tab.component.html',
  styleUrl: './outreach-tab.component.scss',
})
export class OutreachTabComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(ToastService);
  protected readonly stateService = inject(StrategyResearchStateService);

  /* v8 ignore start */
  readonly initialInfluencer = input<ShortlistedInfluencer | null>(null);

  readonly selectedHandle = signal<string>('');
  readonly selectedObjectiveId = signal<string>('');
  readonly selectedPlatform = signal<Platform | ''>('');
  readonly format = signal<OutreachFormat>('dm');
  readonly generatedMessage = signal<string>('');
  readonly isGenerating = signal(false);
  /* v8 ignore stop */

  readonly formatOptions = OUTREACH_FORMAT_OPTIONS;
  readonly platformLabels = PLATFORM_LABELS;

  readonly influencerOptions = computed<DropdownOption[]>(() =>
    this.stateService.shortlistedInfluencers().map((s) => ({
      value: s.handle,
      label: `${s.name} (${s.handle})`,
    })),
  );

  readonly objectiveOptions = computed<DropdownOption[]>(() =>
    this.stateService.objectives().map((o) => ({
      value: o.id,
      label: `${OBJECTIVE_CATEGORY_CONFIG[o.category].emoji} ${o.statement}`,
    })),
  );

  readonly selectedInfluencer = computed<ShortlistedInfluencer | null>(() =>
    this.stateService.shortlistedInfluencers().find((s) => s.handle === this.selectedHandle()) ?? null,
  );

  readonly availablePlatforms = computed<Platform[]>(() => this.selectedInfluencer()?.platforms ?? []);

  constructor() {
    effect(() => {
      const initial = this.initialInfluencer();
      if (initial) {
        this.selectedHandle.set(initial.handle);
        if (initial.platforms.length > 0) this.selectedPlatform.set(initial.platforms[0]);
      }
    });
  }

  setInfluencer(handle: string): void {
    this.selectedHandle.set(handle);
    const inf = this.selectedInfluencer();
    if (inf && inf.platforms.length > 0 && !inf.platforms.includes(this.selectedPlatform() as Platform)) {
      this.selectedPlatform.set(inf.platforms[0]);
    }
    this.generatedMessage.set('');
  }

  setObjective(id: string): void {
    this.selectedObjectiveId.set(id);
  }

  setPlatform(p: Platform): void {
    this.selectedPlatform.set(p);
  }

  setFormat(f: OutreachFormat): void {
    this.format.set(f);
  }

  canGenerate(): boolean {
    return !!this.selectedHandle() && !!this.selectedPlatform() && !this.isGenerating();
  }

  generate(): void {
    if (!this.canGenerate()) return;
    this.isGenerating.set(true);
    safeTimeout(() => {
      this.generatedMessage.set(this.buildMessage());
      this.isGenerating.set(false);
      this.toast.showSuccess('Outreach drafted');
    }, AI_SIMULATION_DELAY_MS, this.destroyRef);
  }

  regenerate(): void {
    this.generate();
  }

  async copy(): Promise<void> {
    const text = this.generatedMessage();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      this.toast.showSuccess('Copied to clipboard');
    } catch {
      this.toast.showError('Copy failed — select the text manually.');
    }
  }

  updateMessage(value: string): void {
    this.generatedMessage.set(value);
  }

  private buildMessage(): string {
    const inf = this.selectedInfluencer();
    if (!inf) return '';
    const objective = this.stateService.objectives().find((o) => o.id === this.selectedObjectiveId());
    const platform = this.selectedPlatform() as Platform;
    const brandVoice = this.stateService.brandVoice();
    const mission = brandVoice.missionStatement || 'building meaningful connections with our audience';
    const name = inf.name.split(' ')[0];
    const platformLabel = this.platformLabels[platform];
    const objectiveLine = objective ? `We're focused on ${objective.statement.toLowerCase()}.` : '';

    if (this.format() === 'email') {
      return [
        `Subject: Partnership idea with ${inf.name}`,
        '',
        `Hi ${name},`,
        '',
        `I've been following your ${platformLabel} content and love how authentic it feels. ${objectiveLine}`,
        `We're ${mission} and think a collaboration could be a great fit.`,
        '',
        'Would you be open to a quick chat about a paid partnership?',
        '',
        'Looking forward to connecting,',
        'The Blink Team',
      ].join('\n');
    }

    return [
      `Hey ${name}! Loved your recent ${platformLabel} posts.`,
      objectiveLine,
      `We're ${mission} and would love to explore a collab with you. Open to chatting?`,
    ].filter(Boolean).join(' ');
  }
}
