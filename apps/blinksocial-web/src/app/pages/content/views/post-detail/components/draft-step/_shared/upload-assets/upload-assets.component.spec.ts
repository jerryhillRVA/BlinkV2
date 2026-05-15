import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { DraftUploadedAssetContract } from '@blinksocial/contracts';
import { UploadAssetsComponent } from './upload-assets.component';

interface SetupInputs {
  assets?: ReadonlyArray<DraftUploadedAssetContract>;
  disabled?: boolean;
}

function setup(inputs: SetupInputs = {}): ComponentFixture<UploadAssetsComponent> {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ imports: [UploadAssetsComponent] });
  const fixture = TestBed.createComponent(UploadAssetsComponent);
  fixture.componentRef.setInput('assets', inputs.assets ?? []);
  if (inputs.disabled !== undefined) {
    fixture.componentRef.setInput('disabled', inputs.disabled);
  }
  fixture.detectChanges();
  return fixture;
}

/**
 * Dispatches a synthetic `change` event on the component's file input.
 * jsdom doesn't let us assign `input.files` directly, so we override
 * the property descriptor before dispatching.
 */
function dispatchFiles(
  fixture: ComponentFixture<UploadAssetsComponent>,
  files: File[],
): void {
  const input = fixture.nativeElement.querySelector(
    'input[type="file"]',
  ) as HTMLInputElement;
  Object.defineProperty(input, 'files', {
    value: files,
    configurable: true,
  });
  input.dispatchEvent(new Event('change'));
  fixture.detectChanges();
}

function mkFile(name: string, mime: string, size = 100): File {
  return new File(['x'.repeat(size)], name, { type: mime });
}

describe('UploadAssetsComponent', () => {
  it('renders empty-state warning copy + Upload Asset button when pool is empty', () => {
    const fixture = setup({ assets: [] });
    const warning = fixture.nativeElement.querySelector('.upload-warning');
    expect(warning).not.toBeNull();
    expect(warning?.getAttribute('role')).toBe('status');
    expect(warning?.getAttribute('aria-live')).toBe('polite');
    expect(warning?.textContent).toContain(
      'Upload at least one asset before building your shot list.',
    );
    expect(fixture.nativeElement.querySelector('.upload-btn')).not.toBeNull();
  });

  it('emits `added` with one asset when a single video file is picked', () => {
    const fixture = setup({ assets: [] });
    const emitted: DraftUploadedAssetContract[][] = [];
    fixture.componentInstance.added.subscribe((a) => emitted.push(a));
    dispatchFiles(fixture, [mkFile('a.mp4', 'video/mp4', 1024)]);
    expect(emitted).toHaveLength(1);
    expect(emitted[0]).toHaveLength(1);
    expect(emitted[0][0]).toMatchObject({
      filename: 'a.mp4',
      mimeType: 'video/mp4',
      size: 1024,
    });
    expect(emitted[0][0].id).toMatch(/^ua-/);
  });

  it('emits `added` with all videos when multiple files are picked', () => {
    const fixture = setup({ assets: [] });
    const emitted: DraftUploadedAssetContract[][] = [];
    fixture.componentInstance.added.subscribe((a) => emitted.push(a));
    dispatchFiles(fixture, [
      mkFile('a.mp4', 'video/mp4'),
      mkFile('b.mov', 'video/quicktime'),
    ]);
    expect(emitted).toHaveLength(1);
    expect(emitted[0]).toHaveLength(2);
    expect(emitted[0].map((a) => a.filename)).toEqual(['a.mp4', 'b.mov']);
  });

  it('rejects non-video files with an inline error and does NOT emit `added`', () => {
    const fixture = setup({ assets: [] });
    const emitted: DraftUploadedAssetContract[][] = [];
    fixture.componentInstance.added.subscribe((a) => emitted.push(a));
    dispatchFiles(fixture, [mkFile('doc.pdf', 'application/pdf')]);
    expect(emitted).toHaveLength(0);
    const err = fixture.nativeElement.querySelector('.upload-error');
    expect(err).not.toBeNull();
    expect(err?.textContent).toContain('doc.pdf');
  });

  it('emits accepted files even when one is rejected in the same pick', () => {
    const fixture = setup({ assets: [] });
    const emitted: DraftUploadedAssetContract[][] = [];
    fixture.componentInstance.added.subscribe((a) => emitted.push(a));
    dispatchFiles(fixture, [
      mkFile('ok.mp4', 'video/mp4'),
      mkFile('bad.pdf', 'application/pdf'),
    ]);
    expect(emitted).toHaveLength(1);
    expect(emitted[0]).toHaveLength(1);
    expect(emitted[0][0].filename).toBe('ok.mp4');
    expect(fixture.nativeElement.querySelector('.upload-error')).not.toBeNull();
  });

  it('renders filled-state thumb-grid + Add More button when pool is non-empty', () => {
    const fixture = setup({
      assets: [
        { id: 'a1', filename: 'clip.mp4', mimeType: 'video/mp4' },
        { id: 'a2', filename: 'cut.mov', mimeType: 'video/quicktime' },
      ],
    });
    const thumbs = fixture.nativeElement.querySelectorAll('.thumb');
    expect(thumbs.length).toBe(2);
    expect(fixture.nativeElement.querySelector('.add-more-btn')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.upload-warning')).toBeNull();
    expect(fixture.nativeElement.querySelector('.upload-btn')).toBeNull();
  });

  it('thumb × emits `removed(id)`', () => {
    const fixture = setup({
      assets: [{ id: 'a1', filename: 'clip.mp4', mimeType: 'video/mp4' }],
    });
    const emitted: string[] = [];
    fixture.componentInstance.removed.subscribe((id) => emitted.push(id));
    const removeBtn = fixture.nativeElement.querySelector(
      '.thumb-remove',
    ) as HTMLButtonElement;
    expect(removeBtn.getAttribute('aria-label')).toBe('Remove clip.mp4');
    removeBtn.click();
    expect(emitted).toEqual(['a1']);
  });

  it('Add More button uses the same accept + multiple semantics as Upload Asset', () => {
    const fixture = setup({
      assets: [{ id: 'a1', filename: 'clip.mp4', mimeType: 'video/mp4' }],
    });
    const input = fixture.nativeElement.querySelector(
      '.add-more-btn input[type="file"]',
    ) as HTMLInputElement;
    expect(input.getAttribute('accept')).toBe('video/*');
    expect(input.hasAttribute('multiple')).toBe(true);
  });

  it('disabled state prevents emission and disables controls', () => {
    const fixture = setup({ assets: [], disabled: true });
    const emitted: DraftUploadedAssetContract[][] = [];
    fixture.componentInstance.added.subscribe((a) => emitted.push(a));
    const fileInput = fixture.nativeElement.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    expect(fileInput.disabled).toBe(true);
    // Even if the change fires (e.g., programmatic), the handler bails.
    dispatchFiles(fixture, [mkFile('a.mp4', 'video/mp4')]);
    expect(emitted).toHaveLength(0);
  });

  it('disabled remove button on thumb does not emit', () => {
    const fixture = setup({
      assets: [{ id: 'a1', filename: 'clip.mp4', mimeType: 'video/mp4' }],
      disabled: true,
    });
    const emitted: string[] = [];
    fixture.componentInstance.removed.subscribe((id) => emitted.push(id));
    const removeBtn = fixture.nativeElement.querySelector(
      '.thumb-remove',
    ) as HTMLButtonElement;
    expect(removeBtn.disabled).toBe(true);
    // Programmatic click — handler bails.
    removeBtn.dispatchEvent(new Event('click', { bubbles: true }));
    expect(emitted).toHaveLength(0);
  });

  it('asset count label pluralizes correctly', () => {
    const one = setup({
      assets: [{ id: 'a1', filename: 'a.mp4' }],
    });
    expect(one.nativeElement.querySelector('.upload-count')?.textContent?.trim()).toBe('1 asset');

    const two = setup({
      assets: [
        { id: 'a1', filename: 'a.mp4' },
        { id: 'a2', filename: 'b.mp4' },
      ],
    });
    expect(two.nativeElement.querySelector('.upload-count')?.textContent?.trim()).toBe('2 assets');
  });
});
