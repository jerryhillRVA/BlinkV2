import { Component, input } from '@angular/core';
import type { DiscoverySectionContract, DiscoverySectionId } from '@blinksocial/contracts';

@Component({
  selector: 'app-section-progress',
  templateUrl: './section-progress.component.html',
  styleUrl: './section-progress.component.scss',
})
export class SectionProgressComponent {
  sections = input.required<DiscoverySectionContract[]>();
  currentSection = input.required<DiscoverySectionId>();
}
