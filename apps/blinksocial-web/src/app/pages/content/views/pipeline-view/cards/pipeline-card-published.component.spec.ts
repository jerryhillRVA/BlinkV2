import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { ContentItem } from '../../../content.types';
import { PipelineCardPublishedComponent } from './pipeline-card-published.component';

function makeItem(partial: Partial<ContentItem> = {}): ContentItem {
  const now = new Date().toISOString();
  return {
    id: 'post-1',
    stage: 'post',
    status: 'published',
    title: 'My published post',
    description: 'desc',
    pillarIds: [],
    segmentIds: [],
    platform: 'instagram',
    contentType: 'reel',
    publishedAt: '2026-05-15T15:30:00.000Z',
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

function setup(item: ContentItem = makeItem()): ComponentFixture<PipelineCardPublishedComponent> {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ imports: [PipelineCardPublishedComponent] });
  const fixture = TestBed.createComponent(PipelineCardPublishedComponent);
  fixture.componentRef.setInput('item', item);
  fixture.componentRef.setInput('pillarNames', []);
  fixture.detectChanges();
  return fixture;
}

describe('PipelineCardPublishedComponent', () => {
  it('renders the green Published status pill', () => {
    const fixture = setup();
    const pill = fixture.nativeElement.querySelector('[data-pill="published"]') as HTMLElement;
    expect(pill).not.toBeNull();
    expect(pill.textContent?.trim()).toContain('Published');
  });

  it('formats publishedAt as a friendly date', () => {
    const fixture = setup();
    expect(fixture.nativeElement.querySelector('.pc-meta-label')?.textContent).toMatch(
      /2026|May|15/,
    );
  });

  it('omits the date row when publishedAt is missing', () => {
    const fixture = setup(makeItem({ publishedAt: undefined }));
    expect(fixture.nativeElement.querySelector('.pc-meta')).toBeNull();
  });

  it('renders the placeholder metrics teaser (— views · — likes · — comments)', () => {
    const fixture = setup();
    const metrics = fixture.nativeElement.querySelectorAll('.pc-metric');
    expect(metrics.length).toBe(3);
    expect(metrics[0].textContent).toContain('— views');
    expect(metrics[1].textContent).toContain('— likes');
    expect(metrics[2].textContent).toContain('— comments');
  });

  it('renders Exported pill ALONGSIDE the Published pill when isExported=true', () => {
    const fixture = setup(makeItem({ isExported: true }));
    expect(fixture.nativeElement.querySelector('[data-pill="published"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-pill="exported"]')).not.toBeNull();
  });

  it('does NOT render Exported pill when isExported is false', () => {
    const fixture = setup(makeItem({ isExported: false }));
    expect(fixture.nativeElement.querySelector('[data-pill="exported"]')).toBeNull();
  });

  it('emits opened on card click', () => {
    const fixture = setup();
    let count = 0;
    fixture.componentInstance.opened.subscribe(() => count++);
    (fixture.nativeElement.querySelector('.card-published') as HTMLButtonElement).dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    );
    fixture.detectChanges();
    expect(count).toBe(1);
  });

  // #146 — warning indicator + thumbnail
  it('renders the AlertTriangle warning when isExported && !livePostUrl', () => {
    const fixture = setup(makeItem({ isExported: true, livePostUrl: undefined }));
    const warning = fixture.nativeElement.querySelector('[data-pill="warning"]') as HTMLElement;
    expect(warning).not.toBeNull();
    expect(warning.getAttribute('aria-label')).toBe(
      'Add post link to enable performance tracking.',
    );
  });

  it('does NOT render warning when isExported && livePostUrl set', () => {
    const fixture = setup(
      makeItem({ isExported: true, livePostUrl: 'https://www.instagram.com/p/abc' }),
    );
    expect(fixture.nativeElement.querySelector('[data-pill="warning"]')).toBeNull();
  });

  it('does NOT render warning when isExported is false', () => {
    const fixture = setup(makeItem({ isExported: false }));
    expect(fixture.nativeElement.querySelector('[data-pill="warning"]')).toBeNull();
  });

  it('renders a thumbnail when packaging.<platform>.coverAssetUrl is set', () => {
    const fixture = setup(
      makeItem({
        production: {
          packaging: {
            instagram: { coverAssetUrl: 'blob:https://example.com/abc' },
          },
        },
      } as Parameters<typeof makeItem>[0]),
    );
    const thumb = fixture.nativeElement.querySelector('.pc-thumb') as HTMLImageElement;
    expect(thumb).not.toBeNull();
    expect(thumb.src).toContain('blob:');
  });

  it('omits the thumbnail when no cover is set', () => {
    const fixture = setup(makeItem());
    expect(fixture.nativeElement.querySelector('.pc-thumb')).toBeNull();
  });
});
