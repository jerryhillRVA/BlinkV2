import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import type {
  ApprovalEntryContract,
  PublishConfigContract,
} from '@blinksocial/contracts';
import type { ContentItem } from '../../../../content.types';
import { ContentStateService } from '../../../../content-state.service';
import { provideContentItemsApiStubs } from '../../../../content-items-api.test-util';
import { PostDetailStore } from '../../post-detail.store';
import { ApproveScheduleStepComponent } from './approve-schedule-step.component';

const NOW = new Date().toISOString();

function makeItem(partial: Partial<ContentItem> = {}): ContentItem {
  return {
    id: 'post-1',
    conceptId: 'concept-1',
    stage: 'post',
    status: 'in-progress',
    title: 'A post',
    description: 'x'.repeat(80),
    pillarIds: ['p1'],
    segmentIds: ['s1'],
    objective: 'engagement',
    platform: 'instagram',
    contentType: 'reel',
    keyMessage: 'Remember this',
    owner: 'user-sarah',
    cta: { type: 'learn-more', text: 'Read more' },
    briefApproved: true,
    briefApprovedAt: NOW,
    briefApprovedBy: 'You',
    createdAt: NOW,
    updatedAt: NOW,
    production: {
      productionStep: 'qa',
      draft: { mode: 'VIDEO' },
    },
    ...partial,
  };
}

function setup(
  itemOverrides: Partial<ContentItem> = {},
): {
  fixture: ComponentFixture<ApproveScheduleStepComponent>;
  store: PostDetailStore;
  state: ContentStateService;
} {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [ApproveScheduleStepComponent],
    providers: [
      ...provideContentItemsApiStubs(),
      ContentStateService,
      PostDetailStore,
      provideRouter([]),
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: { paramMap: { get: () => null } },
        },
      },
    ],
  });
  const state = TestBed.inject(ContentStateService) as ContentStateService;
  const store = TestBed.inject(PostDetailStore) as PostDetailStore;
  state.setItems([makeItem(itemOverrides)]);
  store.setItemId('post-1');
  const fixture = TestBed.createComponent(ApproveScheduleStepComponent);
  fixture.detectChanges();
  return { fixture, store, state };
}

describe('ApproveScheduleStepComponent', () => {
  it('renders the three child cards when the brief is approved', () => {
    const { fixture } = setup();
    expect(fixture.nativeElement.querySelector('app-approval-status-banner')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-approval-workflow-card')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-publish-config-block')).not.toBeNull();
  });

  it('renders the locked-empty message when brief is not approved', () => {
    const { fixture } = setup({
      briefApproved: false,
      briefApprovedAt: undefined,
      briefApprovedBy: undefined,
    });
    expect(fixture.nativeElement.querySelector('app-approval-status-banner')).toBeNull();
    expect(fixture.nativeElement.querySelector('.locked-empty')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Approve the brief');
  });

  it('routes approval-row Approve clicks into store.setApprovalStatus', () => {
    const { fixture, store } = setup();
    const button = Array.from(
      fixture.nativeElement.querySelectorAll('app-approval-workflow-card button'),
    ).find((b) => (b as HTMLButtonElement).textContent?.trim().includes('Approve')) as
      | HTMLButtonElement
      | undefined;
    button?.click();
    fixture.detectChanges();
    expect(store.approvals()[0].status).toBe('approved');
  });

  it('routes Approve & Publish into store.markApproved', () => {
    // Pre-approve the row so the Approve & Publish button is enabled.
    const { fixture, store } = setup();
    store.setApprovalStatus('brand-reviewer', 'approved');
    fixture.detectChanges();
    const cta = fixture.nativeElement.querySelector('.approve-publish') as HTMLButtonElement;
    expect(cta.disabled).toBe(false);
    cta.click();
    expect(store.qaApproved()).toBe(true);
  });

  it('routes publish-config changes into store.setPublishConfig', () => {
    const { fixture, store } = setup();
    const pills = Array.from(
      fixture.nativeElement.querySelectorAll('app-publish-config-block .pill-row [role="radio"]'),
    ) as HTMLButtonElement[];
    const schedulePill = pills.find((p) => p.textContent?.includes('Schedule'));
    schedulePill?.click();
    expect(store.publishConfig().publishAction).toBe('schedule');
  });

  it('wraps content in role="region" with aria-label "Approve and schedule"', () => {
    const { fixture } = setup();
    const region = fixture.nativeElement.querySelector('.approve-schedule-step');
    expect(region?.getAttribute('role')).toBe('region');
    expect(region?.getAttribute('aria-label')).toBe('Approve and schedule');
  });

  it('passes pre-existing approvals + publish config from the item into the children', () => {
    const approvals: ApprovalEntryContract[] = [
      { role: 'brand-reviewer', label: 'Brand Reviewer', required: true, status: 'approved' },
    ];
    const publishConfig: PublishConfigContract = {
      publishAction: 'publish-now',
      deliveryMethod: 'manual',
    };
    const { fixture } = setup({
      production: {
        productionStep: 'qa',
        draft: { mode: 'VIDEO' },
        qa: { approvals, publishConfig },
      },
    });
    expect(fixture.nativeElement.querySelector('.status-pill--approved')).not.toBeNull();
    const selectedPill = fixture.nativeElement.querySelector('app-publish-config-block .pill--selected');
    expect(selectedPill?.textContent?.trim()).toContain('Publish Now');
  });
});
