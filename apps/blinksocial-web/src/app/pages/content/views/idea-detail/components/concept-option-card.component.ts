import { Component, EventEmitter, Input, Output } from '@angular/core';
import type { ConceptOption } from '../idea-detail.types';
import type { ContentPillar, AudienceSegment } from '../../../content.types';

@Component({
  selector: 'app-concept-option-card',
  templateUrl: './concept-option-card.component.html',
  styleUrl: './concept-option-card.component.scss',
})
export class ConceptOptionCardComponent {
  @Input({ required: true }) option!: ConceptOption;
  @Input({ required: true }) pillars: ContentPillar[] = [];
  @Input({ required: true }) segments: AudienceSegment[] = [];
  @Input() selected = false;

  @Output() selectOption = new EventEmitter<string>();

  protected resolvedPillars(): ContentPillar[] {
    return this.option.pillarIds
      .map((id) => this.pillars.find((p) => p.id === id))
      .filter((p): p is ContentPillar => p !== undefined);
  }

  protected pillarNames(): string[] {
    return this.resolvedPillars().map((p) => p.name);
  }

  protected segmentNames(): string[] {
    return this.option.segmentIds
      .map((id) => this.segments.find((s) => s.id === id)?.name ?? '')
      .filter((n) => n.length > 0);
  }

  protected pillarChipStyles(color: string): Record<string, string> {
    return {
      color,
      'border-color': withAlpha(color, 0.25),
      'background-color': withAlpha(color, 0.08),
    };
  }

  protected onClick(): void {
    this.selectOption.emit(this.option.id);
  }
}

function withAlpha(color: string, alpha: number): string {
  const hex = color.replace('#', '').trim();
  const full =
    hex.length === 3
      ? hex.split('').map((c) => c + c).join('')
      : hex.slice(0, 6);
  if (full.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(full)) return color;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
