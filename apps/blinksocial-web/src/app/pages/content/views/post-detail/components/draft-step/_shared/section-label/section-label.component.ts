import { Component, Input } from '@angular/core';

/**
 * Tiny uppercase tracking-wider section/field label primitive.
 * Mirrors the prototype's `text-[10px] tracking-wider font-bold` label
 * convention used throughout the production builder.
 *
 * Renders: `<LABEL>` [info ⓘ] [* required] [<badge>?]
 */
@Component({
  selector: 'app-section-label',
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
