import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import type {
  AudienceSegment,
  BriefPayload,
  ConceptPayload,
  ContentCreatePayload,
  ContentItemType,
  ContentObjective,
  ContentPillar,
  ContentType,
  CtaType,
  GeneratedIdea,
  IdeaMode,
  IdeaPayload,
  Platform,
  ProductionConceptPayload,
  TonePreset,
} from '../../content.types';
import {
  AI_ASSIST_DELAY_MS,
  AI_SIMULATION_DELAY_MS,
  DESCRIPTION_MAX_CHARS,
  DESCRIPTION_MIN_CHARS,
  HOOK_MAX_CHARS,
  CTA_TEXT_MAX_CHARS,
  KEY_MESSAGE_MAX_CHARS,
  MAX_PILLARS_PER_ITEM,
} from '../../content.constants';
import { safeTimeout, toggleArrayItem } from '../../content.utils';
import {
  assistDescriptionFor,
  assistHookFor,
  generateConceptFromObjective,
  seedGeneratedIdeas,
} from './content-create.ai';

export interface FormState {
  type: ContentItemType;
  ideaMode: IdeaMode;
  title: string;
  description: string;
  pillarIds: string[];
  hook: string;
  objective: ContentObjective | '';
  platform: Platform | '';
  contentType: ContentType | '';
  keyMessage: string;
  tonePreset: TonePreset | '';
  segmentIds: string[];
  ctaType: CtaType | '';
  ctaText: string;
  conceptAiGenerated: boolean;
  conceptFilledByAI: boolean;
  isProductionMode: boolean;
  generatePillarIds: string[];
  generatedIdeas: GeneratedIdea[];
  selectedGeneratedIds: string[];
  isGeneratingConcept: boolean;
  isGeneratingIdeas: boolean;
  isAssistingDescription: boolean;
  isAssistingHook: boolean;
}

export const INITIAL_FORM_STATE: FormState = {
  type: 'idea',
  ideaMode: 'manual',
  title: '',
  description: '',
  pillarIds: [],
  hook: '',
  objective: '',
  platform: '',
  contentType: '',
  keyMessage: '',
  tonePreset: '',
  segmentIds: [],
  ctaType: '',
  ctaText: '',
  conceptAiGenerated: false,
  conceptFilledByAI: false,
  isProductionMode: false,
  generatePillarIds: [],
  generatedIdeas: [],
  selectedGeneratedIds: [],
  isGeneratingConcept: false,
  isGeneratingIdeas: false,
  isAssistingDescription: false,
  isAssistingHook: false,
};

/**
 * Scoped per content-create-form instance.
 * Holds the full form state and derived validation.
 */
@Injectable()
export class ContentCreateStore {
  private readonly destroyRef = inject(DestroyRef);

  private readonly _state = signal<FormState>({ ...INITIAL_FORM_STATE });
  private readonly _pillars = signal<ContentPillar[]>([]);
  private readonly _segments = signal<AudienceSegment[]>([]);

  readonly state = this._state.asReadonly();
  readonly pillars = this._pillars.asReadonly();
  readonly segments = this._segments.asReadonly();

  // --- core writes ---------------------------------------------------------
  setContext(pillars: ContentPillar[], segments: AudienceSegment[]): void {
    this._pillars.set(pillars);
    this._segments.set(segments);
  }

  patch(partial: Partial<FormState>): void {
    this._state.update((s) => ({ ...s, ...partial }));
  }

  reset(): void {
    this._state.set({ ...INITIAL_FORM_STATE });
  }

  setType(type: ContentItemType): void {
    this.patch({
      type,
      conceptAiGenerated: false,
      conceptFilledByAI: false,
      isProductionMode: false,
    });
  }

  setIdeaMode(mode: IdeaMode): void {
    this.patch({
      ideaMode: mode,
      generatedIdeas: [],
      selectedGeneratedIds: [],
    });
  }

  togglePillar(id: string): void {
    const current = this._state().pillarIds;
    if (current.includes(id)) {
      this.patch({ pillarIds: current.filter((x) => x !== id) });
      return;
    }
    if (current.length >= MAX_PILLARS_PER_ITEM) return;
    this.patch({ pillarIds: [...current, id] });
  }

  toggleGeneratePillar(id: string): void {
    this.patch({ generatePillarIds: toggleArrayItem(this._state().generatePillarIds, id) });
  }

  toggleSegment(id: string): void {
    this.patch({ segmentIds: toggleArrayItem(this._state().segmentIds, id) });
  }

  toggleGeneratedSelected(id: string): void {
    this.patch({ selectedGeneratedIds: toggleArrayItem(this._state().selectedGeneratedIds, id) });
  }

  setPlatform(platform: Platform | ''): void {
    // platform change invalidates contentType
    this.patch({ platform, contentType: '' });
  }

  // --- validation computeds ------------------------------------------------
  readonly descriptionInRange = computed(() => {
    const len = this._state().description.trim().length;
    return len >= DESCRIPTION_MIN_CHARS && len <= DESCRIPTION_MAX_CHARS;
  });

  readonly hookInRange = computed(() => {
    const hook = this._state().hook.trim();
    return hook.length > 0 && hook.length <= HOOK_MAX_CHARS;
  });

  readonly pillarsInRange = computed(() => {
    const count = this._state().pillarIds.length;
    return count >= 1 && count <= MAX_PILLARS_PER_ITEM;
  });

  readonly keyMessageInRange = computed(() => {
    const msg = this._state().keyMessage.trim();
    return msg.length > 0 && msg.length <= KEY_MESSAGE_MAX_CHARS;
  });

  readonly ctaValid = computed(() => {
    const s = this._state();
    if (!s.ctaType) return true; // optional
    const text = s.ctaText.trim();
    return text.length > 0 && text.length <= CTA_TEXT_MAX_CHARS;
  });

  readonly ideaValid = computed(() => this._state().title.trim().length > 0);

  readonly conceptValid = computed(() => {
    const s = this._state();
    return (
      s.title.trim().length > 0 &&
      this.descriptionInRange() &&
      this.pillarsInRange() &&
      this.hookInRange() &&
      s.objective !== '' &&
      this.ctaValid()
    );
  });

  readonly productionValid = computed(() => {
    const s = this._state();
    return (
      this.conceptValid() &&
      s.platform !== '' &&
      s.platform !== 'tbd' &&
      s.contentType !== '' &&
      s.segmentIds.length > 0
    );
  });

  readonly briefValid = computed(() => {
    const s = this._state();
    return (
      s.title.trim().length > 0 &&
      s.platform !== '' &&
      s.platform !== 'tbd' &&
      s.contentType !== '' &&
      s.objective !== '' &&
      this.keyMessageInRange() &&
      s.segmentIds.length > 0 &&
      this.ctaValid()
    );
  });

  readonly canSave = computed(() => {
    const s = this._state();
    if (s.type === 'idea') {
      if (s.ideaMode === 'generate') {
        return s.selectedGeneratedIds.length > 0;
      }
      return this.ideaValid();
    }
    if (s.type === 'concept') {
      return s.isProductionMode ? this.productionValid() : this.conceptValid();
    }
    // production-brief
    return this.briefValid();
  });

  readonly canMoveToProduction = computed(() => this.productionValid());
  readonly canDraftAssets = computed(() => this.briefValid());

  // --- AI actions (simulated) ---------------------------------------------
  generateConcept(): void {
    const s = this._state();
    if (!s.title.trim() || !s.objective) return;
    this.patch({ isGeneratingConcept: true });
    safeTimeout(
      () => {
        const result = generateConceptFromObjective(
          s.objective as ContentObjective,
          s.pillarIds,
          this._pillars(),
          this._segments(),
          s.segmentIds,
        );
        const patch: Partial<FormState> = {
          description: result.description,
          hook: result.hook,
          isGeneratingConcept: false,
          conceptAiGenerated: true,
          conceptFilledByAI: true,
        };
        if (result.cta) {
          patch.ctaType = result.cta.type;
          patch.ctaText = result.cta.text;
        }
        if (result.pillarIdFallback) {
          patch.pillarIds = [result.pillarIdFallback];
        }
        if (result.segmentIdsFallback.length > 0) {
          patch.segmentIds = result.segmentIdsFallback;
        }
        this.patch(patch);
      },
      AI_SIMULATION_DELAY_MS,
      this.destroyRef,
    );
  }

  assistDescription(): void {
    const s = this._state();
    this.patch({ isAssistingDescription: true });
    safeTimeout(
      () => {
        this.patch({
          description: assistDescriptionFor(s.title, s.objective),
          isAssistingDescription: false,
        });
      },
      AI_ASSIST_DELAY_MS,
      this.destroyRef,
    );
  }

  assistHook(): void {
    const s = this._state();
    this.patch({ isAssistingHook: true });
    safeTimeout(
      () => {
        this.patch({
          hook: assistHookFor(s.title, s.objective),
          isAssistingHook: false,
        });
      },
      AI_ASSIST_DELAY_MS,
      this.destroyRef,
    );
  }

  generateIdeas(): void {
    const s = this._state();
    if (s.generatePillarIds.length === 0) return;
    this.patch({ isGeneratingIdeas: true });
    safeTimeout(
      () => {
        this.patch({
          generatedIdeas: seedGeneratedIdeas(s.generatePillarIds),
          isGeneratingIdeas: false,
        });
      },
      AI_SIMULATION_DELAY_MS,
      this.destroyRef,
    );
  }

  // --- payload builders ----------------------------------------------------
  buildIdeaPayload(): IdeaPayload {
    const s = this._state();
    return {
      kind: 'idea',
      title: s.title,
      description: s.description,
      pillarIds: [...s.pillarIds],
      segmentIds: [...s.segmentIds],
    };
  }

  buildConceptPayload(): ConceptPayload | ProductionConceptPayload {
    const s = this._state();
    const base = {
      title: s.title,
      description: s.description,
      pillarIds: [...s.pillarIds],
      segmentIds: [...s.segmentIds],
      hook: s.hook,
      objective: s.objective as ContentObjective,
      ...(s.ctaType && s.ctaText
        ? { cta: { type: s.ctaType, text: s.ctaText } }
        : {}),
    };
    if (s.isProductionMode) {
      return {
        kind: 'production',
        ...base,
        platform: s.platform as Platform,
        contentType: s.contentType as ContentType,
      };
    }
    return {
      kind: 'concept',
      ...base,
      ...(s.platform ? { platform: s.platform as Platform } : {}),
      ...(s.contentType ? { contentType: s.contentType as ContentType } : {}),
    };
  }

  buildBriefPayload(): BriefPayload {
    const s = this._state();
    return {
      kind: 'brief',
      title: s.title,
      description: s.description,
      pillarIds: [...s.pillarIds],
      segmentIds: [...s.segmentIds],
      platform: s.platform as Platform,
      contentType: s.contentType as ContentType,
      objective: s.objective as ContentObjective,
      keyMessage: s.keyMessage,
      ...(s.tonePreset ? { tonePreset: s.tonePreset } : {}),
      ...(s.ctaType && s.ctaText
        ? { cta: { type: s.ctaType, text: s.ctaText } }
        : {}),
    };
  }

  buildGeneratedIdeaPayloads(): IdeaPayload[] {
    const s = this._state();
    const selected = new Set(s.selectedGeneratedIds);
    return s.generatedIdeas
      .filter((i) => selected.has(i.id))
      .map<IdeaPayload>((idea) => ({
        kind: 'idea',
        title: idea.title,
        description: idea.rationale,
        pillarIds: [idea.pillarId],
        segmentIds: [],
      }));
  }

  buildPayloadForCurrentMode(): ContentCreatePayload | ContentCreatePayload[] {
    const s = this._state();
    if (s.type === 'idea') {
      return s.ideaMode === 'generate'
        ? this.buildGeneratedIdeaPayloads()
        : this.buildIdeaPayload();
    }
    if (s.type === 'concept') {
      return this.buildConceptPayload();
    }
    return this.buildBriefPayload();
  }
}
