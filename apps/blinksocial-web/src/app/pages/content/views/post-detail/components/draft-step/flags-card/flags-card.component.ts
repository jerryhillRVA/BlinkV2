import { Component, computed, inject, signal } from '@angular/core';
import { PostDetailStore } from '../../../post-detail.store';
import { IconComponent } from '../../../../../../../shared/icons/icon.component';
import type { IconName } from '../../../../../../../shared/icons/icons';

interface FlagDef {
  key: 'hasClaims' | 'hasTalent' | 'hasMusic' | 'needsAccessibility';
  label: string;
  icon: IconName;
  iconColor: string;
  hint: (active: boolean) => string;
}

const FLAGS: ReadonlyArray<FlagDef> = [
  {
    key: 'hasClaims',
    label: 'Contains claims',
    icon: 'shield',
    iconColor: '#d97706', // amber-600
    hint: () => 'Requires legal review',
  },
  {
    key: 'hasTalent',
    label: 'Has talent/faces',
    icon: 'users',
    iconColor: '#2563eb', // blue-600
    hint: () => 'Talent release needed',
  },
  {
    key: 'hasMusic',
    label: 'Uses music',
    icon: 'music',
    iconColor: '#9333ea', // purple-600
    hint: () => 'License required',
  },
  {
    key: 'needsAccessibility',
    label: 'Accessibility',
    icon: 'check-circle',
    iconColor: '#16a34a', // green-600
    hint: (active) =>
      active ? 'Captions / alt text required' : 'Not required',
  },
];

/**
 * Collapsible "Flags" card on the Draft step. Lets the user toggle the
 * four compliance flags (claims / talent / music / accessibility) that
 * also live on the Brief — these can change during production (a script
 * edit introduces a claim; talent gets added late) so they're editable
 * post brief-approval via store.persistBriefFlag (no write-lock).
 *
 * Mirrors the prototype's Flags card visually: bold title with a Shield
 * leading icon, amber "N active" badge, subtitle on the right, chevron
 * caret. When open, a 2-up grid of flag cards each with an icon, label,
 * toggle switch, and hint.
 */
@Component({
  selector: 'app-flags-card',
  imports: [IconComponent],
  templateUrl: './flags-card.component.html',
  styleUrl: './flags-card.component.scss',
})
export class FlagsCardComponent {
  protected readonly store = inject(PostDetailStore);

  /* v8 ignore next — signal() default-value branch unreachable from TestBed */
  protected readonly open = signal(false);

  protected readonly flags = FLAGS;

  protected readonly activeCount = this.store.activeFlagCount;

  protected readonly flagValue = computed(() => ({
    hasClaims: this.store.hasClaims(),
    hasTalent: this.store.hasTalent(),
    hasMusic: this.store.hasMusic(),
    needsAccessibility: this.store.needsAccessibility(),
  }));

  protected toggleOpen(): void {
    this.open.update((v) => !v);
  }

  protected onToggle(key: FlagDef['key']): void {
    const next = !this.flagValue()[key];
    switch (key) {
      case 'hasClaims':
        this.store.setHasClaims(next);
        return;
      case 'hasTalent':
        this.store.setHasTalent(next);
        return;
      case 'hasMusic':
        this.store.setHasMusic(next);
        return;
      case 'needsAccessibility':
        this.store.setNeedsAccessibility(next);
        return;
    }
  }
}
