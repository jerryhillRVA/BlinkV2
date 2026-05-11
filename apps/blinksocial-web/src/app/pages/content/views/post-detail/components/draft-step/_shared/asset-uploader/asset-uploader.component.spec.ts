import { TestBed } from '@angular/core/testing';
import { AssetUploaderComponent } from './asset-uploader.component';

function setup(initial: Partial<AssetUploaderComponent> = {}) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ imports: [AssetUploaderComponent] });
  const fixture = TestBed.createComponent(AssetUploaderComponent);
  Object.assign(fixture.componentInstance, initial);
  fixture.detectChanges();
  return fixture;
}

describe('AssetUploaderComponent', () => {
  it('renders the upload zone with the provided label', () => {
    const fixture = setup({ label: 'Upload reel cover' });
    const text = fixture.nativeElement.querySelector('.upload-text');
    expect(text.textContent).toContain('Upload reel cover');
    const zone = fixture.nativeElement.querySelector('.upload-zone');
    expect(zone.getAttribute('aria-label')).toBe('Upload reel cover');
  });

  it('hides the file input but preserves a wrapping label for keyboard activation', () => {
    const fixture = setup();
    const input = fixture.nativeElement.querySelector('input[type="file"]');
    expect(input).toBeTruthy();
    expect(input.classList.contains('visually-hidden')).toBe(true);
    const wrappingLabel = input.closest('label');
    expect(wrappingLabel).toBeTruthy();
  });

  it('emits fileChange with the file metadata when a file is selected', () => {
    const fixture = setup();
    const events: ({ name: string; size: number } | null)[] = [];
    fixture.componentInstance.fileChange.subscribe((v) => events.push(v));
    const file = new File(['x'], 'photo.png', { type: 'image/png' });
    const input = fixture.nativeElement.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file] });
    input.dispatchEvent(new Event('change'));
    expect(events).toEqual([{ name: 'photo.png', size: 1 }]);
  });

  it('renders a file-attached row with a Remove button when filename is set', () => {
    const fixture = setup({ filename: 'photo.png' });
    const fileRow = fixture.nativeElement.querySelector('.file-row');
    expect(fileRow).toBeTruthy();
    expect(fileRow.getAttribute('aria-live')).toBe('polite');
    const remove = fileRow.querySelector('.remove-btn');
    expect(remove.getAttribute('aria-label')).toBe('Remove uploaded image');
  });

  it('emits fileChange(null) when the Remove button is clicked', () => {
    const fixture = setup({ filename: 'photo.png' });
    const events: ({ name: string; size: number } | null)[] = [];
    fixture.componentInstance.fileChange.subscribe((v) => events.push(v));
    const btn = fixture.nativeElement.querySelector('.remove-btn') as HTMLButtonElement;
    btn.click();
    expect(events).toEqual([null]);
  });

  it('emits aiGenerate when the AI button is clicked', () => {
    const fixture = setup();
    let count = 0;
    fixture.componentInstance.aiGenerate.subscribe(() => count++);
    const btn = fixture.nativeElement.querySelector(
      '.ai-generate-btn',
    ) as HTMLButtonElement;
    btn.click();
    expect(count).toBe(1);
  });

  it('does not emit aiGenerate when disabled', () => {
    const fixture = setup({ disabled: true });
    let count = 0;
    fixture.componentInstance.aiGenerate.subscribe(() => count++);
    fixture.componentInstance['onAiGenerate']();
    expect(count).toBe(0);
  });

  it('emits fileChange(null) when the change event fires with no file selected', () => {
    const fixture = setup();
    const events: ({ name: string; size: number } | null)[] = [];
    fixture.componentInstance.fileChange.subscribe((v) => events.push(v));
    const input = fixture.nativeElement.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [] });
    input.dispatchEvent(new Event('change'));
    expect(events).toEqual([null]);
  });
});
