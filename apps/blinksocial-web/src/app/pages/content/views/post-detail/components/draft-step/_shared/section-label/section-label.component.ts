import { Component, Input } from '@angular/core';
import { TooltipComponent } from '../../../../../../../../shared/tooltip/tooltip.component';

/**
 * Tiny uppercase tracking-wider section/field label primitive.
 * Mirrors the prototype's `text-[10px] tracking-wider font-bold` label
 * convention used throughout the production builder.
 *
 * Renders: `<LABEL>` [* required] [info ⓘ] [<badge>?]
 *
 * The info tooltip uses the shared `<app-tooltip>` which portals its
 * popup to `document.body` so the tooltip is never clipped by an
 * `overflow: hidden` ancestor (regression caught in #139 review).
 */
@Component({
  selector: 'app-section-label',
  imports: [TooltipComponent],
  templateUrl: './section-label.component.html',
  styleUrl: './section-label.component.scss',
})
export class SectionLabelComponent {
  @Input({ required: true }) label!: string;
  @Input() info: string | null = null;
  @Input() required = false;
  @Input() badge: string | null = null;
  @Input() badgeVariant: 'amber' | 'neutral' = 'amber';
  @Input() suffix: string | null = null; // e.g. "— optional"
}
