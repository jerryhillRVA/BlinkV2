import { Component, DestroyRef, computed, effect, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DropdownComponent, DropdownOption } from '../../../../../shared/dropdown/dropdown.component';
import { PlatformIconComponent } from '../../../../../shared/platform-icon/platform-icon.component';
import { StrategyResearchStateService } from '../../../strategy-research-state.service';
import { ToastService } from '../../../../../core/toast/toast.service';
import type {
  Platform,
  ShortlistedInfluencer,
} from '../../../strategy-research.types';
import {
  AI_SIMULATION_DELAY_MS,
  INFLUENCER_BRIEF_CONTENT_TYPES,
  OBJECTIVE_CATEGORY_CONFIG,
  PLATFORM_LABELS,
} from '../../../strategy-research.constants';
import { safeTimeout } from '../../../strategy-research.utils';

interface BriefFormState {
  campaignName: string;
  contentType: string;
  keyMessages: string;
  deliverables: string;
  startDate: string;
  postDate: string;
  toneGuidance: string;
  hashtags: string;
  cta: string;
  ftcDisclosure: boolean;
}

const EMPTY_FORM: BriefFormState = {
  campaignName: '',
  contentType: INFLUENCER_BRIEF_CONTENT_TYPES[0],
  keyMessages: '',
  deliverables: '',
  startDate: '',
  postDate: '',
  toneGuidance: '',
  hashtags: '',
  cta: '',
  ftcDisclosure: true,
};

@Component({
  selector: 'app-influencer-brief-tab',
  imports: [CommonModule, FormsModule, DropdownComponent, PlatformIconComponent],
  templateUrl: './brief-tab.component.html',
  styleUrl: './brief-tab.component.scss',
})
export class BriefTabComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(ToastService);
  protected readonly stateService = inject(StrategyResearchStateService);

  /* v8 ignore start */
  readonly initialInfluencer = input<ShortlistedInfluencer | null>(null);

  readonly selectedHandle = signal<string>('');
  readonly selectedObjectiveId = signal<string>('');
  readonly selectedPlatforms = signal<Platform[]>([]);
  readonly form = signal<BriefFormState>({ ...EMPTY_FORM });
  readonly generatedBrief = signal<string>('');
  readonly isGenerating = signal(false);
  /* v8 ignore stop */

  readonly contentTypeOptions: DropdownOption[] = INFLUENCER_BRIEF_CONTENT_TYPES.map((v) => ({ value: v, label: v }));
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
        this.selectedPlatforms.set([...initial.platforms]);
      }
    });

    // Auto-populate key messages from pillar names.
    effect(() => {
      const pillars = this.stateService.pillars();
      this.form.update((f) =>
        f.keyMessages
          ? f
          : { ...f, keyMessages: pillars.map((p) => `• ${p.name}`).join('\n') },
      );
    });
  }

  setInfluencer(handle: string): void {
    this.selectedHandle.set(handle);
    const inf = this.selectedInfluencer();
    if (inf) this.selectedPlatforms.set([...inf.platforms]);
  }

  setObjective(id: string): void {
    this.selectedObjectiveId.set(id);
  }

  setContentType(value: string): void {
    this.form.update((f) => ({ ...f, contentType: value }));
  }

  togglePlatform(p: Platform): void {
    this.selectedPlatforms.update((list) => (list.includes(p) ? list.filter((x) => x !== p) : [...list, p]));
  }

  isPlatformActive(p: Platform): boolean {
    return this.selectedPlatforms().includes(p);
  }

  updateField<K extends keyof BriefFormState>(field: K, value: BriefFormState[K]): void {
    this.form.update((f) => ({ ...f, [field]: value }));
  }

  canGenerate(): boolean {
    return !!this.selectedHandle() && !!this.form().campaignName.trim() && !this.isGenerating();
  }

  generate(): void {
    if (!this.canGenerate()) return;
    this.isGenerating.set(true);
    safeTimeout(() => {
      this.generatedBrief.set(this.buildBrief());
      this.isGenerating.set(false);
      this.toast.showSuccess('Brief generated');
    }, AI_SIMULATION_DELAY_MS, this.destroyRef);
  }

  regenerate(): void {
    this.generate();
  }

  async copy(): Promise<void> {
    const text = this.generatedBrief();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      this.toast.showSuccess('Copied to clipboard');
    } catch {
      this.toast.showError('Copy failed — select the text manually.');
    }
  }

  private buildBrief(): string {
    const inf = this.selectedInfluencer()!;
    const f = this.form();
    const objective = this.stateService.objectives().find((o) => o.id === this.selectedObjectiveId());
    const platformLabels = this.selectedPlatforms().map((p) => PLATFORM_LABELS[p]).join(', ') || 'TBD';
    const divider = '──────────────────────────────────';

    return [
      'CAMPAIGN BRIEF',
      '══════════════════════════════════',
      `Campaign: ${f.campaignName}`,
      `Creator: ${inf.name} (${inf.handle})`,
      `Platforms: ${platformLabels}`,
      `Content type: ${f.contentType}`,
      objective ? `Objective: ${objective.statement}` : 'Objective: TBD',
      '',
      'KEY MESSAGES',
      divider,
      f.keyMessages || '• (none specified)',
      '',
      'DELIVERABLES',
      divider,
      f.deliverables || '• (none specified)',
      '',
      'TIMELINE',
      divider,
      `Start: ${f.startDate || 'TBD'}`,
      `Post: ${f.postDate || 'TBD'}`,
      '',
      'TONE & STYLE',
      divider,
      f.toneGuidance || 'Match your authentic voice.',
      '',
      'HASHTAGS & CTA',
      divider,
      `Required: ${f.hashtags || '(none)'}`,
      `CTA: ${f.cta || '(none)'}`,
      '',
      'DISCLOSURE',
      divider,
      f.ftcDisclosure ? 'Required: include #ad or #sponsored.' : 'Disclosure: per creator guidelines.',
    ].join('\n');
  }
}
