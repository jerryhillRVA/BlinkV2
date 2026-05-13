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
});
