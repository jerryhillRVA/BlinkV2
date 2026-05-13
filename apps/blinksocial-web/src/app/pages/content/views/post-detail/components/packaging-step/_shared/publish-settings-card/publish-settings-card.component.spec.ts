import { ComponentFixture, TestBed } from '@angular/core/testing';
import type {
  ContentTypeContract,
  PackagingInstagramContract,
  PackagingPlatformControlsIGContract,
  PlatformContract,
} from '@blinksocial/contracts';
import {
  PublishSettingsCardComponent,
  type PublishSettingsIGMetadataPatch,
} from './publish-settings-card.component';

interface SetupOptions {
  platform?: PlatformContract;
  contentType?: ContentTypeContract | null;
  igMetadata?: Partial<PackagingInstagramContract>;
  igControls?: PackagingPlatformControlsIGContract;
  disabled?: boolean;
}

function setup(opts: SetupOptions = {}): ComponentFixture<PublishSettingsCardComponent> {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ imports: [PublishSettingsCardComponent] });
  const fixture = TestBed.createComponent(PublishSettingsCardComponent);
  fixture.componentRef.setInput('platform', opts.platform ?? 'instagram');
  fixture.componentRef.setInput('contentType', opts.contentType ?? null);
  fixture.componentRef.setInput('igMetadata', opts.igMetadata);
  fixture.componentRef.setInput('igControls', opts.igControls);
  fixture.componentRef.setInput('disabled', opts.disabled ?? false);
  fixture.detectChanges();
  return fixture;
}

function expandCard(fixture: ComponentFixture<PublishSettingsCardComponent>): void {
  (fixture.nativeElement.querySelector('.ps-header') as HTMLButtonElement).click();
  fixture.detectChanges();
}

describe('PublishSettingsCardComponent', () => {
  it('renders the parent "Publish Settings" label and is collapsed by default', () => {
    const fixture = setup();
    expect(
      fixture.nativeElement.querySelector('.ps-title')?.textContent?.trim(),
    ).toBe('Publish Settings');
    // Body is collapsed until the header is clicked.
    expect(fixture.nativeElement.querySelector('.ps-body')).toBeNull();
  });

  it('clicking the header expands the body and reveals both sub-sections', () => {
    const fixture = setup();
    expandCard(fixture);
    expect(fixture.nativeElement.querySelector('.ps-body')).not.toBeNull();
    const subs = fixture.nativeElement.querySelectorAll('.ps-sub-title');
    const labels = Array.from(subs).map((s) => (s as HTMLElement).textContent?.trim());
    expect(labels).toEqual(['Metadata', 'Platform Controls']);
  });

  it('IG + reel: Metadata shows people + product + reels-cover rows', () => {
    const fixture = setup({ contentType: 'reel' });
    expandCard(fixture);
    const text = fixture.nativeElement.textContent ?? '';
    expect(text).toContain('People tags');
    expect(text).toContain('Product tags');
    expect(text).toContain('#Reels cover tag');
  });

  it('IG + carousel: Metadata shows people only', () => {
    const fixture = setup({ contentType: 'carousel' });
    expandCard(fixture);
    const text = fixture.nativeElement.textContent ?? '';
    expect(text).toContain('People tags');
    expect(text).not.toContain('Product tags');
    expect(text).not.toContain('#Reels cover tag');
  });

  it('IG + live: Metadata empty placeholder; Controls show live rows', () => {
    const fixture = setup({ contentType: 'live' });
    expandCard(fixture);
    const text = fixture.nativeElement.textContent ?? '';
    expect(text).toContain('No platform metadata');
    expect(text).toContain('Co-host handles');
    expect(text).toContain('Fundraiser goal');
    expect(text).toContain('Q&A mode');
    expect(text).toContain('Notify followers');
    // Live rows do NOT include the static comments/like/paid toggles.
    expect(text).not.toContain('Turn off comments');
    expect(text).not.toContain('Hide like count');
  });

  it('IG + reel: Controls show comments off + hide like + paid partnership + collaborator', () => {
    const fixture = setup({ contentType: 'reel' });
    expandCard(fixture);
    const text = fixture.nativeElement.textContent ?? '';
    expect(text).toContain('Turn off comments');
    expect(text).toContain('Hide like count');
    expect(text).toContain('Paid partnership / branded content');
    expect(text).toContain('Collaborator tag');
  });

  it('IG + story: Controls include Close Friends only, no Hide like / collaborator', () => {
    const fixture = setup({ contentType: 'story' });
    expandCard(fixture);
    const text = fixture.nativeElement.textContent ?? '';
    expect(text).toContain('Close Friends only');
    expect(text).toContain('Turn off comments');
    expect(text).toContain('Paid partnership / branded content');
    expect(text).not.toContain('Hide like count');
    expect(text).not.toContain('Collaborator tag');
  });

  it('Paid partnership callout appears when toggle is on', () => {
    const fixture = setup({
      contentType: 'reel',
      igControls: { paidPartnership: true },
    });
    expandCard(fixture);
    expect(fixture.nativeElement.querySelector('.ps-callout')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain(
      'You must have a formal agreement with the brand',
    );
  });

  it('Paid partnership callout hidden when toggle is off', () => {
    const fixture = setup({
      contentType: 'reel',
      igControls: { paidPartnership: false },
    });
    expandCard(fixture);
    expect(fixture.nativeElement.querySelector('.ps-callout')).toBeNull();
  });

  it('adding a People tag emits igMetadataChange with the merged array', () => {
    const fixture = setup({ contentType: 'reel', igMetadata: { peopleTags: ['@alex'] } });
    expandCard(fixture);
    const emitted: PublishSettingsIGMetadataPatch[] = [];
    fixture.componentInstance.igMetadataChange.subscribe((p) => emitted.push(p));
    const input = fixture.nativeElement.querySelector(
      '.ps-chip-input-row .ps-input--chip',
    ) as HTMLInputElement;
    input.value = '@jamie';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.ps-chip-add') as HTMLButtonElement).click();
    expect(emitted[0]).toEqual({ peopleTags: ['@alex', '@jamie'] });
  });

  it('pressing Enter in People draft also adds the chip', () => {
    const fixture = setup({ contentType: 'reel' });
    expandCard(fixture);
    const emitted: PublishSettingsIGMetadataPatch[] = [];
    fixture.componentInstance.igMetadataChange.subscribe((p) => emitted.push(p));
    const input = fixture.nativeElement.querySelector(
      '.ps-chip-input-row .ps-input--chip',
    ) as HTMLInputElement;
    input.value = '@sky';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(emitted[0]).toEqual({ peopleTags: ['@sky'] });
  });

  it('removing a People chip emits igMetadataChange with the filtered array', () => {
    const fixture = setup({
      contentType: 'reel',
      igMetadata: { peopleTags: ['@alex', '@jamie'] },
    });
    expandCard(fixture);
    const emitted: PublishSettingsIGMetadataPatch[] = [];
    fixture.componentInstance.igMetadataChange.subscribe((p) => emitted.push(p));
    const removeBtn = fixture.nativeElement.querySelector(
      '.ps-chip-remove',
    ) as HTMLButtonElement;
    removeBtn.click();
    expect(emitted[0]).toEqual({ peopleTags: ['@jamie'] });
  });

  it('toggling Turn off comments emits igControlsChange with merged state', () => {
    const fixture = setup({ contentType: 'reel', igControls: { hideLikeCount: true } });
    expandCard(fixture);
    const emitted: PackagingPlatformControlsIGContract[] = [];
    fixture.componentInstance.igControlsChange.subscribe((p) => emitted.push(p));
    // First switch in the controls section is "Turn off comments"
    const switches = fixture.nativeElement.querySelectorAll('.ps-switch');
    (switches[0] as HTMLButtonElement).click();
    expect(emitted[0]).toEqual({ hideLikeCount: true, commentsOff: true });
  });

  it('typing in Reels cover tag emits igMetadataChange with the new value', () => {
    const fixture = setup({ contentType: 'reel' });
    expandCard(fixture);
    const emitted: PublishSettingsIGMetadataPatch[] = [];
    fixture.componentInstance.igMetadataChange.subscribe((p) => emitted.push(p));
    // Reels cover input is the only non-chip input in metadata.
    const inputs = fixture.nativeElement.querySelectorAll('.ps-row .ps-input');
    // index: people draft (chip), product draft (chip), reels cover (plain)
    const cover = inputs[2] as HTMLInputElement;
    cover.value = 'morning-flow';
    cover.dispatchEvent(new Event('input'));
    expect(emitted[0]).toEqual({ reelsCoverTag: 'morning-flow' });
  });

  it('adding a co-host via Enter emits igControlsChange with the handle (stripped @)', () => {
    const fixture = setup({ contentType: 'live' });
    expandCard(fixture);
    const emitted: PackagingPlatformControlsIGContract[] = [];
    fixture.componentInstance.igControlsChange.subscribe((p) => emitted.push(p));
    const coHostInput = Array.from(
      fixture.nativeElement.querySelectorAll('.ps-input'),
    ).find((el) =>
      ((el as HTMLInputElement).getAttribute('aria-label') ?? '').includes('co-host'),
    ) as HTMLInputElement;
    coHostInput.value = '@guest';
    coHostInput.dispatchEvent(new Event('input'));
    coHostInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(emitted[0]).toEqual({ coHostHandles: ['guest'] });
  });

  it('co-host input disables when 4 handles are present', () => {
    const fixture = setup({
      contentType: 'live',
      igControls: { coHostHandles: ['a', 'b', 'c', 'd'] },
    });
    expandCard(fixture);
    const coHostInput = Array.from(
      fixture.nativeElement.querySelectorAll('.ps-input'),
    ).find((el) =>
      ((el as HTMLInputElement).getAttribute('aria-label') ?? '').includes('co-host'),
    ) as HTMLInputElement;
    expect(coHostInput.disabled).toBe(true);
    expect(coHostInput.placeholder).toBe('Max 4 reached');
  });

  it('non-IG platform: both sections show empty placeholders (future migration target)', () => {
    const fixture = setup({ platform: 'tiktok', contentType: 'short-video' });
    expandCard(fixture);
    const text = fixture.nativeElement.textContent ?? '';
    expect(text).toContain('No platform metadata');
    expect(text).toContain('No platform controls');
  });

  it('disabled state: clicking a switch does NOT emit', () => {
    const fixture = setup({ contentType: 'reel', disabled: true });
    expandCard(fixture);
    const emitted: PackagingPlatformControlsIGContract[] = [];
    fixture.componentInstance.igControlsChange.subscribe((p) => emitted.push(p));
    (fixture.nativeElement.querySelector('.ps-switch') as HTMLButtonElement).click();
    expect(emitted).toEqual([]);
  });

  it('Metadata sub-section can be collapsed independently', () => {
    const fixture = setup({ contentType: 'reel' });
    expandCard(fixture);
    // First sub-header is Metadata
    const subHeaders = fixture.nativeElement.querySelectorAll('.ps-sub-header');
    (subHeaders[0] as HTMLButtonElement).click();
    fixture.detectChanges();
    // After collapsing, "People tags" row should be gone but
    // "Turn off comments" (Controls section) should still be present.
    const text = fixture.nativeElement.textContent ?? '';
    expect(text).not.toContain('People tags');
    expect(text).toContain('Turn off comments');
  });

  // ── Branch-coverage tests for IG control handlers ──────────────────
  // These exercise the individual emit handlers + their disabled guards,
  // which the higher-level UI tests don't always hit directly.

  it('toggleIgHideLikeCount emits the inverted value', () => {
    const fixture = setup({ contentType: 'reel', igControls: { hideLikeCount: false } });
    expandCard(fixture);
    const emitted: PackagingPlatformControlsIGContract[] = [];
    fixture.componentInstance.igControlsChange.subscribe((p) => emitted.push(p));
    fixture.componentInstance['toggleIgHideLikeCount']();
    expect(emitted[0]).toEqual({ hideLikeCount: true });
  });

  it('toggleIgCloseFriendsOnly emits inverted closeFreindsOnly', () => {
    const fixture = setup({ contentType: 'story' });
    expandCard(fixture);
    const emitted: PackagingPlatformControlsIGContract[] = [];
    fixture.componentInstance.igControlsChange.subscribe((p) => emitted.push(p));
    fixture.componentInstance['toggleIgCloseFriendsOnly']();
    expect(emitted[0]).toEqual({ closeFreindsOnly: true });
  });

  it('toggleIgQaMode + toggleIgNotifyFollowers emit live-row controls', () => {
    const fixture = setup({ contentType: 'live' });
    expandCard(fixture);
    const emitted: PackagingPlatformControlsIGContract[] = [];
    fixture.componentInstance.igControlsChange.subscribe((p) => emitted.push(p));
    fixture.componentInstance['toggleIgQaMode']();
    fixture.componentInstance['toggleIgNotifyFollowers']();
    expect(emitted).toHaveLength(2);
    expect(emitted[0]).toEqual({ qaMode: true });
    expect(emitted[1]).toEqual({ notifyFollowers: true });
  });

  it('onIgCollaboratorTagInput + onIgFundraiserGoalInput route through emitIgControl', () => {
    const fixture = setup({ contentType: 'reel' });
    expandCard(fixture);
    const emitted: PackagingPlatformControlsIGContract[] = [];
    fixture.componentInstance.igControlsChange.subscribe((p) => emitted.push(p));
    fixture.componentInstance['onIgCollaboratorTagInput']({
      target: { value: '@brand' },
    } as unknown as Event);
    expect(emitted[0]).toEqual({ collaboratorTag: '@brand' });
  });

  it('onIgFundraiserGoalInput emits fundraiserGoal', () => {
    const fixture = setup({ contentType: 'live' });
    expandCard(fixture);
    const emitted: PackagingPlatformControlsIGContract[] = [];
    fixture.componentInstance.igControlsChange.subscribe((p) => emitted.push(p));
    fixture.componentInstance['onIgFundraiserGoalInput']({
      target: { value: '$5,000' },
    } as unknown as Event);
    expect(emitted[0]).toEqual({ fundraiserGoal: '$5,000' });
  });

  it('emitIgControl is a no-op when disabled', () => {
    const fixture = setup({ contentType: 'reel', disabled: true });
    const emitted: PackagingPlatformControlsIGContract[] = [];
    fixture.componentInstance.igControlsChange.subscribe((p) => emitted.push(p));
    fixture.componentInstance['toggleIgCommentsOff']();
    fixture.componentInstance['toggleIgHideLikeCount']();
    fixture.componentInstance['toggleIgPaidPartnership']();
    expect(emitted).toEqual([]);
  });

  it('addPeopleTag is a no-op for empty drafts or duplicates', () => {
    const fixture = setup({ contentType: 'reel', igMetadata: { peopleTags: ['@a'] } });
    expandCard(fixture);
    const emitted: unknown[] = [];
    fixture.componentInstance.igMetadataChange.subscribe((p) => emitted.push(p));
    // Empty draft: no emit
    fixture.componentInstance['peopleDraft'].set('');
    fixture.componentInstance['addPeopleTag']();
    expect(emitted).toEqual([]);
    // Duplicate: no emit but draft clears
    fixture.componentInstance['peopleDraft'].set('@a');
    fixture.componentInstance['addPeopleTag']();
    expect(emitted).toEqual([]);
    expect(fixture.componentInstance['peopleDraft']()).toBe('');
  });

  it('addProductTag is a no-op for empty drafts or duplicates', () => {
    const fixture = setup({ contentType: 'reel', igMetadata: { productTags: ['#p'] } });
    expandCard(fixture);
    const emitted: unknown[] = [];
    fixture.componentInstance.igMetadataChange.subscribe((p) => emitted.push(p));
    fixture.componentInstance['productDraft'].set('  ');
    fixture.componentInstance['addProductTag']();
    expect(emitted).toEqual([]);
    fixture.componentInstance['productDraft'].set('#p');
    fixture.componentInstance['addProductTag']();
    expect(emitted).toEqual([]);
    expect(fixture.componentInstance['productDraft']()).toBe('');
  });

  it('removeProductTag emits a filtered productTags array', () => {
    const fixture = setup({
      contentType: 'reel',
      igMetadata: { productTags: ['#a', '#b'] },
    });
    expandCard(fixture);
    const emitted: unknown[] = [];
    fixture.componentInstance.igMetadataChange.subscribe((p) => emitted.push(p));
    fixture.componentInstance['removeProductTag']('#a');
    expect(emitted[0]).toEqual({ productTags: ['#b'] });
  });

  it('removeCoHost emits the filtered coHostHandles array', () => {
    const fixture = setup({
      contentType: 'live',
      igControls: { coHostHandles: ['x', 'y', 'z'] },
    });
    expandCard(fixture);
    const emitted: PackagingPlatformControlsIGContract[] = [];
    fixture.componentInstance.igControlsChange.subscribe((p) => emitted.push(p));
    fixture.componentInstance['removeCoHost']('y');
    expect(emitted[0]).toEqual({ coHostHandles: ['x', 'z'] });
  });

  it('Co-host non-Enter keys do not add to handles', () => {
    const fixture = setup({ contentType: 'live' });
    expandCard(fixture);
    const emitted: PackagingPlatformControlsIGContract[] = [];
    fixture.componentInstance.igControlsChange.subscribe((p) => emitted.push(p));
    fixture.componentInstance['coHostDraft'].set('foo');
    fixture.componentInstance['onCoHostKeydown'](
      new KeyboardEvent('keydown', { key: 'a' }),
    );
    expect(emitted).toEqual([]);
  });

  it('Co-host Enter with empty draft is a no-op', () => {
    const fixture = setup({ contentType: 'live' });
    expandCard(fixture);
    const emitted: PackagingPlatformControlsIGContract[] = [];
    fixture.componentInstance.igControlsChange.subscribe((p) => emitted.push(p));
    fixture.componentInstance['coHostDraft'].set('');
    fixture.componentInstance['onCoHostKeydown'](
      new KeyboardEvent('keydown', { key: 'Enter' }),
    );
    expect(emitted).toEqual([]);
  });

  it('Co-host Enter at 4-handle cap is a no-op', () => {
    const fixture = setup({
      contentType: 'live',
      igControls: { coHostHandles: ['a', 'b', 'c', 'd'] },
    });
    expandCard(fixture);
    const emitted: PackagingPlatformControlsIGContract[] = [];
    fixture.componentInstance.igControlsChange.subscribe((p) => emitted.push(p));
    fixture.componentInstance['coHostDraft'].set('e');
    fixture.componentInstance['onCoHostKeydown'](
      new KeyboardEvent('keydown', { key: 'Enter' }),
    );
    expect(emitted).toEqual([]);
  });

  it('disabled state guards: addPeopleTag, removePeopleTag, removeCoHost, onReelsCoverInput are no-ops', () => {
    const fixture = setup({
      contentType: 'live',
      disabled: true,
      igMetadata: { peopleTags: ['@a'], reelsCoverTag: '' },
      igControls: { coHostHandles: ['x'] },
    });
    expandCard(fixture);
    const meta: unknown[] = [];
    const ctrls: unknown[] = [];
    fixture.componentInstance.igMetadataChange.subscribe((p) => meta.push(p));
    fixture.componentInstance.igControlsChange.subscribe((p) => ctrls.push(p));
    fixture.componentInstance['peopleDraft'].set('@b');
    fixture.componentInstance['addPeopleTag']();
    fixture.componentInstance['removePeopleTag']('@a');
    fixture.componentInstance['removeCoHost']('x');
    fixture.componentInstance['onReelsCoverInput']({
      target: { value: 'x' },
    } as unknown as Event);
    expect(meta).toEqual([]);
    expect(ctrls).toEqual([]);
  });
});
