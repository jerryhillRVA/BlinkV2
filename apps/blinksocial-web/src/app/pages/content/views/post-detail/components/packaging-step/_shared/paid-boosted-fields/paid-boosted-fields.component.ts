import { Component, input, output } from '@angular/core';

/**
 * Amber-styled required-fields panel that renders below the Publishing
 * Mode toggle when the user picks PAID_BOOSTED. The three fields all
 * live on `production.brief` but are the user's canonical
 * packaging-side decisions per the prototype — see PostDetailStore's
 * `persistPackagingSideBrief` for the brief write-lock carve-out.
 */
@Component({
  selector: 'app-paid-boosted-fields',
  templateUrl: './paid-boosted-fields.component.html',
  styleUrl: './paid-boosted-fields.component.scss',
})
export class PaidBoostedFieldsComponent {
  readonly campaignName = input<string | undefined>(undefined);
  readonly destinationUrl = input<string | undefined>(undefined);
  readonly legalApprover = input<string | undefined>(undefined);
  readonly disabled = input(false);

  readonly campaignNameChange = output<string>();
  readonly destinationUrlChange = output<string>();
  readonly legalApproverChange = output<string>();

  protected onCampaignInput(e: Event): void {
    this.campaignNameChange.emit((e.target as HTMLInputElement).value ?? '');
  }

  protected onUrlInput(e: Event): void {
    this.destinationUrlChange.emit((e.target as HTMLInputElement).value ?? '');
  }

  protected onApproverInput(e: Event): void {
    this.legalApproverChange.emit((e.target as HTMLInputElement).value ?? '');
  }
}
