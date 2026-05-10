import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  OnDestroy,
  Output,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PostDetailStore } from '../../post-detail.store';
import type { ProductionStep } from '../../post-detail.types';
import { IconComponent } from '../../../../../../shared/icons/icon.component';

const STEP_LABEL: Record<ProductionStep, string> = {
  brief: 'Brief',
  draft: 'Draft',
  packaging: 'Packaging',
  qa: 'Approve & Schedule',
};

/**
 * Fixed-bottom action bar shared across all production-detail steps.
 *
 * Visually: position: sticky; bottom: 0 — stays pinned to the viewport
 * bottom while the post-detail container extends below it, then reaches
 * its natural position when the user scrolls past the content so the
 * page footer is never covered.
 *
 * Behaviorally: a stepper-wizard bar. Back navigates to the previous
 * step (or out to the pipeline when on Brief). Continue advances to the
 * next step via store.advanceProductionStep — which persists
 * production.productionStep so the next visit lands the user there.
 */
@Component({
  selector: 'app-step-action-bar',
  imports: [IconComponent],
  templateUrl: './step-action-bar.component.html',
  styleUrl: './step-action-bar.component.scss',
})
export class StepActionBarComponent implements AfterViewInit, OnDestroy {
  protected readonly store = inject(PostDetailStore);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly hostRef = inject(ElementRef<HTMLElement>);

  /** Emitted when Back is clicked on the Brief step (no previous step). */
  @Output() backToList = new EventEmitter<void>();

  /**
   * The visual state of the bar, driven by an IntersectionObserver on a
   * sentinel positioned just below the bar:
   *   - 'pinned' — bar is sticky-stuck to viewport bottom (default).
   *   - 'floating' — user has scrolled past the bar's natural position;
   *     the bar now sits above the page footer like a card.
   * CSS animates the visual differences between the two states.
   */
  protected readonly state = signal<'pinned' | 'floating'>('pinned');

  @HostBinding('attr.data-state')
  get hostStateAttr(): 'pinned' | 'floating' {
    return this.state();
  }

  private observer?: IntersectionObserver;

  protected readonly activeStep = this.store.activeStep;

  protected readonly briefApproved = computed(
    () => !!this.store.item()?.briefApproved,
  );

  protected readonly nextStep = computed<ProductionStep | null>(() => {
    switch (this.activeStep()) {
      case 'brief':
        return 'draft';
      case 'draft':
        return 'packaging';
      case 'packaging':
        return 'qa';
      case 'qa':
        return null;
    }
  });

  protected readonly previousStep = computed<ProductionStep | null>(() => {
    switch (this.activeStep()) {
      case 'brief':
        return null;
      case 'draft':
        return 'brief';
      case 'packaging':
        return 'draft';
      case 'qa':
        return 'packaging';
    }
  });

  protected readonly continueLabel = computed(() => {
    const next = this.nextStep();
    if (!next) return 'Finish';
    return `Continue to ${STEP_LABEL[next]}`;
  });

  protected readonly backLabel = computed(() => {
    const prev = this.previousStep();
    if (!prev) return 'Back to pipeline';
    return `Back to ${STEP_LABEL[prev]}`;
  });

  protected readonly continueEnabled = computed(() => {
    switch (this.activeStep()) {
      case 'brief':
        return this.briefApproved();
      case 'draft':
        return this.store.canContinueFromDraft();
      case 'packaging':
      case 'qa':
        // Not implemented yet — leave the CTA visible but disabled so the
        // affordance is consistent across all four steps.
        return false;
    }
  });

  protected onBack(): void {
    const prev = this.previousStep();
    if (prev) {
      // UI-only navigation. Don't regress the persisted productionStep
      // — the user is reviewing, not undoing progress.
      this.store.setActiveStep(prev);
    } else {
      this.backToList.emit();
    }
  }

  protected onContinue(): void {
    if (!this.continueEnabled()) return;
    const next = this.nextStep();
    if (next) this.store.advanceProductionStep(next);
  }

  // ── pinned / floating detection via IntersectionObserver ───────────────

  ngAfterViewInit(): void {
    // Skip on the server. SSR's first paint uses the default 'pinned'
    // state which is correct for the typical landing (bar above-the-fold
    // viewport bottom; pinned-look until the user scrolls).
    if (!isPlatformBrowser(this.platformId)) return;
    if (typeof IntersectionObserver === 'undefined') return;

    // The sentinel is placed by post-detail.component as the next-element
    // sibling of this host. Placing it outside the sticky-positioned host
    // is mandatory: an absolutely-positioned sentinel INSIDE the host
    // follows the sticky offset and never reflects the natural position.
    const sentinel = this.hostRef.nativeElement.nextElementSibling;
    if (!(sentinel instanceof HTMLElement)) return;

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          // Sentinel sits just below the bar's natural position. When it
          // enters the viewport, the user has scrolled past the bar's
          // natural position — i.e., the bar has un-pinned.
          this.state.set(entry.isIntersecting ? 'floating' : 'pinned');
        }
      },
      { threshold: 0 },
    );
    this.observer.observe(sentinel);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
