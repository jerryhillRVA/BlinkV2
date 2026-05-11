import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StepActionBarComponent } from './step-action-bar.component';
import { PostDetailStore } from '../../post-detail.store';
import { ContentStateService } from '../../../../content-state.service';
import { provideContentItemsApiStubs } from '../../../../content-items-api.test-util';
import type { ContentItem } from '../../../../content.types';

function makeItem(partial: Partial<ContentItem> = {}): ContentItem {
  const now = new Date().toISOString();
  return {
    id: 'p',
    stage: 'post',
    status: 'in-progress',
    title: 'P',
    description: 'x'.repeat(80),
    pillarIds: ['p1'],
    segmentIds: ['s1'],
    platform: 'instagram',
    contentType: 'reel',
    keyMessage: 'set',
    owner: 'user-sarah',
    cta: { type: 'learn-more', text: 'go' },
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

function setup(item: ContentItem = makeItem()): {
  fixture: ComponentFixture<StepActionBarComponent>;
  store: PostDetailStore;
} {
  TestBed.configureTestingModule({
    imports: [StepActionBarComponent],
    providers: [
      ...provideContentItemsApiStubs(),
      ContentStateService,
      PostDetailStore,
    ],
  });
  TestBed.inject(ContentStateService).setItems([item]);
  const store = TestBed.inject(PostDetailStore);
  store.setItemId(item.id);
  const fixture = TestBed.createComponent(StepActionBarComponent);
  fixture.detectChanges();
  return { fixture, store };
}

describe('StepActionBarComponent', () => {
  describe('label resolution', () => {
    it('on Brief — back goes to pipeline, continue → Draft', () => {
      const { fixture, store } = setup();
      store.setActiveStep('brief');
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.back-btn').textContent).toContain(
        'Back to pipeline',
      );
      expect(fixture.nativeElement.querySelector('.continue-btn').textContent).toContain(
        'Continue to Draft',
      );
    });

    it('on Draft — back goes to Brief, continue → Packaging', () => {
      const { fixture, store } = setup(makeItem({ briefApproved: true }));
      store.setActiveStep('draft');
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.back-btn').textContent).toContain(
        'Back to Brief',
      );
      expect(fixture.nativeElement.querySelector('.continue-btn').textContent).toContain(
        'Continue to Packaging',
      );
    });

    it('on Packaging — back goes to Draft, continue → Approve & Schedule', () => {
      const { fixture, store } = setup(makeItem({ briefApproved: true }));
      store.setActiveStep('packaging');
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.back-btn').textContent).toContain(
        'Back to Draft',
      );
      expect(fixture.nativeElement.querySelector('.continue-btn').textContent).toContain(
        'Continue to Approve & Schedule',
      );
    });

    it('on QA — back goes to Packaging, continue → Finish', () => {
      const { fixture, store } = setup(makeItem({ briefApproved: true }));
      store.setActiveStep('qa');
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.back-btn').textContent).toContain(
        'Back to Packaging',
      );
      expect(fixture.nativeElement.querySelector('.continue-btn').textContent).toContain(
        'Finish',
      );
    });
  });

  describe('continue gating', () => {
    it('Brief: disabled when briefApproved=false, enabled when briefApproved=true', () => {
      const item = makeItem({ briefApproved: false });
      const { fixture, store } = setup(item);
      store.setActiveStep('brief');
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('.continue-btn') as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
      expect(btn.getAttribute('aria-disabled')).toBe('true');

      store.approveBrief();
      fixture.detectChanges();
      expect(btn.disabled).toBe(false);
      expect(btn.getAttribute('aria-disabled')).toBeNull();
    });

    it('Draft: disabled until canContinueFromDraft() is true', () => {
      const { fixture, store } = setup(makeItem({ briefApproved: true }));
      store.setActiveStep('draft');
      store.setDraftMode('VIDEO');
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('.continue-btn') as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
      // Add hook + shot to satisfy VIDEO mode requirements.
      store.setVideoHook('A hook');
      store.setVideoShotList([
        { id: 's1', type: 'Shot', description: 'd', duration: '5s' },
      ]);
      fixture.detectChanges();
      expect(btn.disabled).toBe(false);
    });

    it('Packaging + QA: always disabled (not yet implemented)', () => {
      const { fixture, store } = setup(makeItem({ briefApproved: true }));
      store.setActiveStep('packaging');
      fixture.detectChanges();
      expect((fixture.nativeElement.querySelector('.continue-btn') as HTMLButtonElement).disabled).toBe(true);

      store.setActiveStep('qa');
      fixture.detectChanges();
      expect((fixture.nativeElement.querySelector('.continue-btn') as HTMLButtonElement).disabled).toBe(true);
    });
  });

  describe('back navigation', () => {
    it('on Brief — clicking Back emits backToList', () => {
      const { fixture, store } = setup();
      store.setActiveStep('brief');
      fixture.detectChanges();
      let count = 0;
      fixture.componentInstance.backToList.subscribe(() => count++);
      (fixture.nativeElement.querySelector('.back-btn') as HTMLButtonElement).click();
      expect(count).toBe(1);
    });

    it('on Draft — clicking Back sets activeStep to brief (UI-only, no persist)', () => {
      const item = makeItem({
        briefApproved: true,
        production: { productionStep: 'draft' },
      });
      const { fixture, store } = setup(item);
      store.setActiveStep('draft');
      fixture.detectChanges();
      (fixture.nativeElement.querySelector('.back-btn') as HTMLButtonElement).click();
      expect(store.activeStep()).toBe('brief');
      // productionStep stays at 'draft' — the user is reviewing, not undoing.
      expect(store.item()?.production?.productionStep).toBe('draft');
    });
  });

  describe('continue advances + persists', () => {
    it('Brief → click Continue → activeStep=draft + productionStep=draft persisted', () => {
      const item = makeItem({ briefApproved: true });
      const { fixture, store } = setup(item);
      store.setActiveStep('brief');
      fixture.detectChanges();
      (fixture.nativeElement.querySelector('.continue-btn') as HTMLButtonElement).click();
      expect(store.activeStep()).toBe('draft');
      expect(store.item()?.production?.productionStep).toBe('draft');
    });

    it('Draft → click Continue (when allowed) → activeStep=packaging + productionStep=packaging persisted', () => {
      const item = makeItem({ briefApproved: true });
      const { fixture, store } = setup(item);
      store.setActiveStep('draft');
      store.setDraftMode('VIDEO');
      store.setVideoHook('A hook');
      store.setVideoShotList([
        { id: 's1', type: 'Shot', description: 'd', duration: '5s' },
      ]);
      fixture.detectChanges();
      (fixture.nativeElement.querySelector('.continue-btn') as HTMLButtonElement).click();
      expect(store.activeStep()).toBe('packaging');
      expect(store.item()?.production?.productionStep).toBe('packaging');
    });

    it('Continue button is a no-op when disabled', () => {
      const { fixture, store } = setup(makeItem({ briefApproved: false }));
      store.setActiveStep('brief');
      fixture.detectChanges();
      // Click via the protected handler to skip the disabled-attr DOM-level gating
      fixture.componentInstance['onContinue']();
      expect(store.activeStep()).toBe('brief');
    });
  });

  it('renders a nav element with aria-label', () => {
    const { fixture, store } = setup();
    store.setActiveStep('brief');
    fixture.detectChanges();
    const nav = fixture.nativeElement.querySelector('nav.step-action-bar');
    expect(nav).toBeTruthy();
    expect(nav.getAttribute('aria-label')).toBe('Production step navigation');
  });

  describe('IntersectionObserver lifecycle', () => {
    it('wires an observer when a sibling HTMLElement sentinel is present + flips state on intersect', () => {
      type Cb = (entries: { isIntersecting: boolean }[]) => void;
      const observers: { cb: Cb }[] = [];
      const RealIO = (
        globalThis as unknown as { IntersectionObserver: unknown }
      ).IntersectionObserver;
      class FakeIO {
        cb: Cb;
        disconnect = vi.fn();
        observe = vi.fn();
        constructor(cb: Cb) {
          this.cb = cb;
          observers.push({ cb });
        }
      }
      (globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = FakeIO;

      const { fixture } = setup();
      // Wrap the host with a parent we control, then append a sentinel
      // as the host's next-element sibling so the component's lookup hits.
      const host = fixture.nativeElement as HTMLElement;
      const wrapper = document.createElement('div');
      document.body.appendChild(wrapper);
      wrapper.appendChild(host);
      const sentinel = document.createElement('div');
      wrapper.appendChild(sentinel);
      // Re-fire ngAfterViewInit now that the DOM has the expected shape.
      fixture.componentInstance.ngAfterViewInit();
      expect(observers.length).toBeGreaterThan(0);
      const { cb } = observers[observers.length - 1];
      cb([{ isIntersecting: true }]);
      fixture.detectChanges();
      expect(fixture.nativeElement.getAttribute('data-state')).toBe('floating');
      cb([{ isIntersecting: false }]);
      fixture.detectChanges();
      expect(fixture.nativeElement.getAttribute('data-state')).toBe('pinned');
      // Restore.
      (globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = RealIO;
      wrapper.remove();
    });

    it('does nothing when there is no sibling sentinel (covers the non-HTMLElement branch)', () => {
      const { fixture } = setup();
      // Default jsdom fixture has no sibling for the host.
      expect(() => fixture.componentInstance.ngAfterViewInit()).not.toThrow();
      // Bar stays in its default state.
      expect(fixture.nativeElement.getAttribute('data-state')).toBe('pinned');
    });

    it('skips wiring entirely when IntersectionObserver is unavailable', () => {
      const RealIO = (
        globalThis as unknown as { IntersectionObserver: unknown }
      ).IntersectionObserver;
      (globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = undefined;
      const { fixture } = setup();
      const host = fixture.nativeElement as HTMLElement;
      host.parentElement?.appendChild(document.createElement('div'));
      expect(() => fixture.componentInstance.ngAfterViewInit()).not.toThrow();
      (globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = RealIO;
    });

    it('ngOnDestroy disconnects the observer if one was wired', () => {
      type Cb = (entries: { isIntersecting: boolean }[]) => void;
      const disconnect = vi.fn();
      const RealIO = (
        globalThis as unknown as { IntersectionObserver: unknown }
      ).IntersectionObserver;
      class FakeIO {
        disconnect = disconnect;
        observe = vi.fn();
        constructor(_cb: Cb) {
          // no-op
        }
      }
      (globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = FakeIO;
      const { fixture } = setup();
      const host = fixture.nativeElement as HTMLElement;
      host.parentElement?.appendChild(document.createElement('div'));
      fixture.componentInstance.ngAfterViewInit();
      fixture.componentInstance.ngOnDestroy();
      expect(disconnect).toHaveBeenCalled();
      (globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = RealIO;
    });
  });
});
