import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LivePostLinkCardComponent } from './live-post-link-card.component';

function setup(
  opts: {
    url?: string | null;
    isExported?: boolean;
    publishedAt?: string | null;
  } = {},
): ComponentFixture<LivePostLinkCardComponent> {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ imports: [LivePostLinkCardComponent] });
  const fixture = TestBed.createComponent(LivePostLinkCardComponent);
  if (opts.url !== undefined) fixture.componentRef.setInput('url', opts.url);
  if (opts.isExported !== undefined)
    fixture.componentRef.setInput('isExported', opts.isExported);
  if (opts.publishedAt !== undefined)
    fixture.componentRef.setInput('publishedAt', opts.publishedAt);
  fixture.detectChanges();
  return fixture;
}

describe('LivePostLinkCardComponent', () => {
  // Publish Now (read-only)
  it('Publish Now variant: renders URL as plain text + external-link icon', () => {
    const fixture = setup({
      url: 'https://www.instagram.com/p/B1A2',
      isExported: false,
      publishedAt: '2026-05-15T15:00:00Z',
    });
    expect(fixture.nativeElement.querySelector('.lp-readonly')?.textContent?.trim()).toBe(
      'https://www.instagram.com/p/B1A2',
    );
    expect(fixture.nativeElement.querySelector('.lp-input')).toBeNull();
    const link = fixture.nativeElement.querySelector('.lp-external') as HTMLAnchorElement;
    expect(link).not.toBeNull();
    expect(link.target).toBe('_blank');
    expect(link.getAttribute('href')).toBe('https://www.instagram.com/p/B1A2');
  });

  // Export Packet (editable)
  it('Export Packet variant: empty state renders placeholder + no external-link icon', () => {
    const fixture = setup({ url: undefined, isExported: true, publishedAt: undefined });
    const input = fixture.nativeElement.querySelector('.lp-input') as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(input.placeholder).toBe('Paste the published post URL…');
    expect(fixture.nativeElement.querySelector('.lp-external')).toBeNull();
  });

  it('Export Packet variant: blur with new URL emits urlChange', () => {
    const fixture = setup({ url: undefined, isExported: true, publishedAt: undefined });
    let emitted: string | undefined;
    fixture.componentInstance.urlChange.subscribe((v) => (emitted = v));
    const input = fixture.nativeElement.querySelector('.lp-input') as HTMLInputElement;
    input.value = 'https://x';
    input.dispatchEvent(new Event('blur'));
    expect(emitted).toBe('https://x');
  });

  it('Export Packet variant: Enter triggers blur (which commits)', () => {
    const fixture = setup({ url: undefined, isExported: true, publishedAt: undefined });
    let emitted: string | undefined;
    fixture.componentInstance.urlChange.subscribe((v) => (emitted = v));
    const input = fixture.nativeElement.querySelector('.lp-input') as HTMLInputElement;
    input.value = 'https://y';
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    input.dispatchEvent(new Event('blur'));
    expect(emitted).toBe('https://y');
  });

  it('Export Packet variant: first save emits publishedAtAutoSet when publishedAt missing', () => {
    const fixture = setup({ url: undefined, isExported: true, publishedAt: undefined });
    let autoSet = false;
    fixture.componentInstance.publishedAtAutoSet.subscribe(() => (autoSet = true));
    const input = fixture.nativeElement.querySelector('.lp-input') as HTMLInputElement;
    input.value = 'https://z';
    input.dispatchEvent(new Event('blur'));
    expect(autoSet).toBe(true);
  });

  it('Export Packet variant: subsequent edit does NOT re-emit publishedAtAutoSet', () => {
    const fixture = setup({
      url: 'https://old',
      isExported: true,
      publishedAt: '2026-05-15T15:00:00Z',
    });
    let autoSet = false;
    fixture.componentInstance.publishedAtAutoSet.subscribe(() => (autoSet = true));
    const input = fixture.nativeElement.querySelector('.lp-input') as HTMLInputElement;
    input.value = 'https://new';
    input.dispatchEvent(new Event('blur'));
    expect(autoSet).toBe(false);
  });

  it('blur with unchanged value is a no-op', () => {
    const fixture = setup({ url: 'https://x', isExported: true, publishedAt: '2026-05-15T15:00:00Z' });
    let count = 0;
    fixture.componentInstance.urlChange.subscribe(() => count++);
    const input = fixture.nativeElement.querySelector('.lp-input') as HTMLInputElement;
    input.value = 'https://x';
    input.dispatchEvent(new Event('blur'));
    expect(count).toBe(0);
  });

  it('shows external-link icon once URL is filled (Export variant)', () => {
    const fixture = setup({ url: 'https://z', isExported: true, publishedAt: undefined });
    expect(fixture.nativeElement.querySelector('.lp-external')).not.toBeNull();
  });
});
