import { Component, input } from '@angular/core';
import type { DiscoverySectionContract, DiscoverySectionId } from '@blinksocial/contracts';

@Component({
  selector: 'app-section-progress',
  templateUrl: './section-progress.component.html',
  styleUrl: './section-progress.component.scss',
})
export class SectionProgressComponent {
  /* v8 ignore next 2 — V8's function-call-throws branches on input()/signal() declarations are unreachable (Angular class-field init time; ESM exports not spy-able) */
  sections = input.required<DiscoverySectionContract[]>();
  currentSection = input.required<DiscoverySectionId>();
}
