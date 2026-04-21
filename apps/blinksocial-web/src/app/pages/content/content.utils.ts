import type { DestroyRef } from '@angular/core';
import type {
  ContentItem,
  ContentCreatePayload,
  IdeaPayload,
  ConceptPayload,
  ProductionConceptPayload,
  BriefPayload,
} from './content.types';

export function safeTimeout(callback: () => void, ms: number, destroyRef: DestroyRef): void {
  const id = setTimeout(callback, ms);
  destroyRef.onDestroy(() => clearTimeout(id));
}

export function generateId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function toggleArrayItem<T>(arr: readonly T[], item: T): T[] {
  return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
}

export function buildContentItem(payload: ContentCreatePayload): ContentItem {
  const now = new Date().toISOString();
  const base = {
    id: generateId('c'),
    title: payload.title.trim(),
    description: payload.description.trim(),
    pillarIds: [...payload.pillarIds],
    segmentIds: [...payload.segmentIds],
    createdAt: now,
    updatedAt: now,
  };
  switch (payload.kind) {
    case 'idea':
      return buildIdea(base, payload);
    case 'concept':
      return buildConcept(base, payload);
    case 'production':
      return buildProduction(base, payload);
    case 'brief':
      return buildBrief(base, payload);
  }
}

type BaseItemFields = Pick<
  ContentItem,
  'id' | 'title' | 'description' | 'pillarIds' | 'segmentIds' | 'createdAt' | 'updatedAt'
>;

function buildIdea(base: BaseItemFields, _payload: IdeaPayload): ContentItem {
  return { ...base, stage: 'idea', status: 'draft' };
}

function buildConcept(base: BaseItemFields, payload: ConceptPayload): ContentItem {
  return {
    ...base,
    stage: 'concept',
    status: 'draft',
    hook: payload.hook.trim(),
    objective: payload.objective,
    ...(payload.platform ? { platform: payload.platform } : {}),
    ...(payload.contentType ? { contentType: payload.contentType } : {}),
    ...(payload.cta ? { cta: { type: payload.cta.type, text: payload.cta.text.trim() } } : {}),
  };
}

function buildProduction(base: BaseItemFields, payload: ProductionConceptPayload): ContentItem {
  return {
    ...base,
    stage: 'concept',
    status: 'in-progress',
    hook: payload.hook.trim(),
    objective: payload.objective,
    platform: payload.platform,
    contentType: payload.contentType,
    ...(payload.cta ? { cta: { type: payload.cta.type, text: payload.cta.text.trim() } } : {}),
  };
}

function buildBrief(base: BaseItemFields, payload: BriefPayload): ContentItem {
  return {
    ...base,
    stage: 'production-brief',
    status: 'in-progress',
    platform: payload.platform,
    contentType: payload.contentType,
    objective: payload.objective,
    keyMessage: payload.keyMessage.trim(),
    ...(payload.tonePreset ? { tonePreset: payload.tonePreset } : {}),
    ...(payload.cta ? { cta: { type: payload.cta.type, text: payload.cta.text.trim() } } : {}),
  };
}
