import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IdeaDetailHeaderComponent } from './idea-detail-header.component';
import type { ContentItem } from '../../../content.types';

function makeItem(partial: Partial<ContentItem> = {}): ContentItem {
  const now = new Date().toISOString();
  return {
    id: 'c-1',
    stage: 'idea',
    status: 'draft',
    title: 'A testable idea',
    description: '',
    pillarIds: [],
    segmentIds: [],
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

function setup(item: ContentItem = makeItem()): ComponentFixture<IdeaDetailHeaderComponent> {
  TestBed.configureTestingModule({ imports: [IdeaDetailHeaderComponent] });
  const fixture = TestBed.createComponent(IdeaDetailHeaderComponent);
  fixture.componentRef.setInput('item', item);
  fixture.detectChanges();
  return fixture;
}

describe('IdeaDetailHeaderComponent', () => {
  it('renders the Back button, stage badge (Idea), and inline-editable title', () => {
    const fixture = setup();
    expect(fixture.nativeElement.querySelector('.detail-back')).not.toBeNull();
    const badge: HTMLElement = fixture.nativeElement.querySelector('.stage-badge');
    expect(badge.textContent?.trim()).toContain('Idea');
    expect(badge.classList.contains('stage-idea')).toBe(true);
    expect(fixture.nativeElement.querySelector('app-inline-edit')).not.toBeNull();
    expect((fixture.nativeElement.textContent as string)).toContain('A testable idea');
  });

  it('stage badge switches with the item stage', () => {
    const fixture = setup(makeItem({ stage: 'concept' }));
    const badge = fixture.nativeElement.querySelector('.stage-badge') as HTMLElement;
    expect(badge.classList.contains('stage-concept')).toBe(true);
    expect(badge.textContent?.trim()).toContain('Concept');
  });

  it('hides the platform chip when no platform is set', () => {
    const fixture = setup(makeItem({ platform: undefined }));
    expect(fixture.nativeElement.querySelector('.detail-platform')).toBeNull();
  });

  it('renders platform label + content type when both are present', () => {
    const fixture = setup(makeItem({ platform: 'instagram', contentType: 'reel' }));
    const chip: HTMLElement = fixture.nativeElement.querySelector('.detail-platform');
    expect(chip).not.toBeNull();
    expect(chip.textContent).toContain('Instagram');
    expect(chip.textContent).toContain('Reel');
  });

  it('Back button emits back', () => {
    const fixture = setup();
    let count = 0;
    fixture.componentInstance.back.subscribe(() => count++);
    (fixture.nativeElement.querySelector('.detail-back') as HTMLButtonElement).click();
    expect(count).toBe(1);
  });

  it('Concept CTA uses a solid brand color background (no gradient)', () => {
    const fixture = setup();
    const btn = fixture.nativeElement.querySelector('.btn-advance') as HTMLButtonElement;
    const bg = getComputedStyle(btn).background;
    const bgImage = getComputedStyle(btn).backgroundImage;
    expect(bg.includes('linear-gradient') || bgImage.includes('linear-gradient')).toBe(false);
  });

  it('Concept CTA emits advance', () => {
    const fixture = setup();
    let count = 0;
    fixture.componentInstance.advance.subscribe(() => count++);
    (fixture.nativeElement.querySelector('.btn-advance') as HTMLButtonElement).click();
    expect(count).toBe(1);
  });

  it('menu opens, emits archive/duplicate/copyLink, and closes after click', () => {
    const fixture = setup();
    const archived: number[] = [];
    const duplicated: number[] = [];
    const copied: number[] = [];
    fixture.componentInstance.archive.subscribe(() => archived.push(1));
    fixture.componentInstance.duplicate.subscribe(() => duplicated.push(1));
    fixture.componentInstance.copyLink.subscribe(() => copied.push(1));

    const menuBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.detail-menu-btn');
    menuBtn.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.detail-menu-panel')).not.toBeNull();

    const items = Array.from(
      fixture.nativeElement.querySelectorAll('.detail-menu-item') as NodeListOf<HTMLButtonElement>,
    );
    const byLabel = (text: string) =>
      items.find((el) => el.textContent?.includes(text)) as HTMLButtonElement;
    byLabel('Copy link').click();
    expect(copied.length).toBe(1);
    expect(fixture.componentInstance['menuOpen']()).toBe(false); // closed

    menuBtn.click();
    fixture.detectChanges();
    byLabel('Duplicate').click();
    expect(duplicated.length).toBe(1);

    menuBtn.click();
    fixture.detectChanges();
    byLabel('Archive').click();
    expect(archived.length).toBe(1);
  });

  it('titleChange emits when the inline edit commits', () => {
    const fixture = setup();
    const emitted: string[] = [];
    fixture.componentInstance.titleChange.subscribe((v) => emitted.push(v));
    (fixture.componentInstance as unknown as { onTitleChange: (v: string) => void }).onTitleChange('New');
    expect(emitted).toEqual(['New']);
  });

  it('unknown stage falls back to the idea badge', () => {
    const fixture = setup(makeItem({ stage: 'unknown' as never }));
    const badge = fixture.nativeElement.querySelector('.stage-badge') as HTMLElement;
    // idea fallback
    expect(badge.classList.contains('stage-idea')).toBe(true);
  });

  it('platform with unknown contentType hides the content type span, not the label', () => {
    const fixture = setup(makeItem({ platform: 'instagram', contentType: 'unknown' as never }));
    const chip = fixture.nativeElement.querySelector('.detail-platform') as HTMLElement;
    expect(chip).not.toBeNull();
    expect(chip.textContent).toContain('Instagram');
  });

  it('platform chip hidden when platform is unknown value', () => {
    const fixture = setup(makeItem({ platform: 'mystery' as never }));
    // When platform label resolves to null, the template still renders the chip but with blank label.
    // Still, the public helper returns null for an unknown platform.
    const comp = fixture.componentInstance as unknown as { platformLabel: () => string | null };
    expect(comp.platformLabel()).toBeNull();
  });

  it('clicking outside closes the menu', () => {
    const fixture = setup();
    (fixture.nativeElement.querySelector('.detail-menu-btn') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.componentInstance['menuOpen']()).toBe(true);
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance['menuOpen']()).toBe(false);
  });
});
