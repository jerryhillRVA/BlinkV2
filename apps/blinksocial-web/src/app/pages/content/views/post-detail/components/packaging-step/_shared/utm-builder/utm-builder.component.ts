import { Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { PackagingUtmContract } from '@blinksocial/contracts';

type UtmField = keyof PackagingUtmContract;

interface UtmFieldDef {
  readonly key: UtmField;
  readonly label: string;
  readonly idSuffix: string;
}

const FIELDS: ReadonlyArray<UtmFieldDef> = [
  { key: 'source', label: 'Source', idSuffix: 'source' },
  { key: 'medium', label: 'Medium', idSuffix: 'medium' },
  { key: 'campaign', label: 'Campaign', idSuffix: 'campaign' },
  { key: 'content', label: 'Content', idSuffix: 'content' },
  { key: 'term', label: 'Term', idSuffix: 'term' },
];

/**
 * Collapsible UTM-parameters editor. Renders five plain inputs inside a
 * `<details>` element. Each keystroke emits the merged contract via
 * `utmChange`. A short preview line below the inputs composes the
 * appended `?utm_*=…` query string from any non-empty fields.
 */
@Component({
  selector: 'app-utm-builder',
  imports: [FormsModule],
  templateUrl: './utm-builder.component.html',
  styleUrl: './utm-builder.component.scss',
})
export class UtmBuilderComponent {
  /* v8 ignore next 2 — signal-input default-value branches are unreachable from TestBed */
  readonly utm = input<PackagingUtmContract | undefined>(undefined);
  readonly disabled = input(false);

  readonly utmChange = output<PackagingUtmContract>();

  protected readonly fields = FIELDS;

  protected readonly preview = computed(() => {
    const u = this.utm() ?? {};
    const parts: string[] = [];
    if (u.source) parts.push(`utm_source=${encodeURIComponent(u.source)}`);
    if (u.medium) parts.push(`utm_medium=${encodeURIComponent(u.medium)}`);
    if (u.campaign) parts.push(`utm_campaign=${encodeURIComponent(u.campaign)}`);
    if (u.content) parts.push(`utm_content=${encodeURIComponent(u.content)}`);
    if (u.term) parts.push(`utm_term=${encodeURIComponent(u.term)}`);
    return parts.length ? `Appended: ?${parts.join('&')}` : '';
  });

  protected onFieldInput(key: UtmField, value: string): void {
    if (this.disabled()) return;
    const next: PackagingUtmContract = { ...(this.utm() ?? {}), [key]: value };
    this.utmChange.emit(next);
  }

  protected valueFor(key: UtmField): string {
    return this.utm()?.[key] ?? '';
  }

  protected idFor(suffix: string): string {
    return `utm-${suffix}`;
  }
}
