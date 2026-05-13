import { Component, input } from '@angular/core';
import type { DiscoverySectionContract, DiscoverySectionId } from '@blinksocial/contracts';

@Component({
  selector: 'app-section-progress',
  templateUrl: './section-progress.component.html',
  styleUrl: './section-progress.component.scss',
})
export class SectionProgressComponent {
  /* v8 ignore next — signal-input default-value branch unreachable from TestBed */
  sections = input.required<DiscoverySectionContract[]>();
  /* v8 ignore next — signal-input default-value branch unreachable from TestBed */
  currentSection = input.required<DiscoverySectionId>();
}
