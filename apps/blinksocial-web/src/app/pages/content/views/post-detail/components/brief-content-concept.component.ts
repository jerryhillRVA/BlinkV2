import { Component, EventEmitter, Output, computed, input } from '@angular/core';
import {
  pillarBg as sharedPillarBg,
  pillarBorder as sharedPillarBorder,
  pillarText as sharedPillarText,
} from '../../_shared/pillar-style.utils';
import { OBJECTIVE_OPTIONS } from '../../../content.constants';
import type {
  AudienceSegment,
  ContentItem,
  ContentPillar,
} from '../../../content.types';
import type { BusinessObjectiveContract } from '@blinksocial/contracts';

@Component({
  selector: 'app-brief-content-concept',
  templateUrl: './brief-content-concept.component.html',
  styleUrl: './brief-content-concept.component.scss',
})
export class BriefContentConceptComponent {
  readonly concept = input<ContentItem | null>(null);
  readonly pillars = input<ContentPillar[]>([]);
  readonly segments = input<AudienceSegment[]>([]);
  readonly objectives = input<BusinessObjectiveContract[]>([]);

  @Output() editConcept = new EventEmitter<void>();

  protected readonly selectedPillars = computed<ContentPillar[]>(() => {
    const ids = this.concept()?.pillarIds ?? [];
    const lookup = new Map(this.pillars().map((p) => [p.id, p]));
    return ids.map((id) => lookup.get(id)).filter(Boolean) as ContentPillar[];
  });

  protected readonly selectedSegments = computed<AudienceSegment[]>(() => {
    const ids = this.concept()?.segmentIds ?? [];
    const lookup = new Map(this.segments().map((s) => [s.id, s]));
    return ids.map((id) => lookup.get(id)).filter(Boolean) as AudienceSegment[];
  });

  protected readonly objectiveLabel = computed<string | null>(() => {
    const v = this.concept()?.objective;
    if (!v) return null;
    return OBJECTIVE_OPTIONS.find((o) => o.value === v)?.label ?? null;
  });

  protected readonly businessObjectiveStatement = computed<string | null>(() => {
    const id = this.concept()?.objectiveId;
    if (!id) return null;
    return this.objectives().find((o) => o.id === id)?.statement ?? null;
  });

  protected pillarBg(p: ContentPillar): string | null {
    return sharedPillarBg(p, true);
  }
  protected pillarBorder(p: ContentPillar): string | null {
    return sharedPillarBorder(p, true);
  }
  protected pillarText(p: ContentPillar): string | null {
    return sharedPillarText(p, true);
  }

  protected onEdit(): void {
    this.editConcept.emit();
  }
}
