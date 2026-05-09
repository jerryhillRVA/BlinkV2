import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PostDetailHeaderComponent } from './post-detail-header.component';
import type { ContentItem } from '../../../content.types';

function makeItem(partial: Partial<ContentItem> = {}): ContentItem {
  const now = new Date().toISOString();
  return {
    id: 'post-1',
    conceptId: 'concept-1',
    stage: 'post',
    status: 'in-progress',
    title: 'A post',
    description: '',
    pillarIds: [],
    segmentIds: [],
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

function setup(
  item: ContentItem = makeItem(),
  briefApproved = false,
): ComponentFixture<PostDetailHeaderComponent> {
  TestBed.configureTestingModule({ imports: [PostDetailHeaderComponent] });
  const fixture = TestBed.createComponent(PostDetailHeaderComponent);
  fixture.componentRef.setInput('item', item);
  fixture.componentRef.setInput('briefApproved', briefApproved);
  fixture.detectChanges();
  return fixture;
}

describe('PostDetailHeaderComponent', () => {
  it('renders the orange Production badge with a Clapperboard icon', () => {
    const fixture = setup();
    const badge = fixture.nativeElement.querySelector('.stage-badge') as HTMLElement;
    expect(badge.classList.contains('stage-production')).toBe(true);
    expect(badge.textContent?.trim()).toContain('Production');
    expect(badge.textContent?.trim()).not.toContain('PRODUCTION');
    const svg = badge.querySelector('svg') as SVGElement;
    expect(svg.getAttribute('width')).toBe('12');
    expect(svg.getAttribute('height')).toBe('12');
    // Clapperboard signature path — `d` starts with M20.2 6 (the angled bar).
    const paths = Array.from(svg.querySelectorAll('path')).map((p) => p.getAttribute('d') ?? '');
    expect(paths.some((d) => d.startsWith('M20.2 6'))).toBe(true);
  });

  it('renders inline-edit title, Saved indicator, and the kebab menu button', () => {
    const fixture = setup();
    expect(fixture.nativeElement.querySelector('app-inline-edit')).not.toBeNull();
    expect(
      (fixture.nativeElement.querySelector('.detail-saved') as HTMLElement).textContent?.trim(),
    ).toBe('Saved');
    expect(fixture.nativeElement.querySelector('.detail-menu-btn')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.detail-back')).toBeNull();
    // The old inline back-to-concept button is gone — moved into the kebab menu.
    expect(fixture.nativeElement.querySelector('.btn-back-to-concept')).toBeNull();
  });

  it('kebab menu shows "Send back to Concept" when conceptId is set', () => {
    const fixture = setup(makeItem({ conceptId: 'c-42' }));
    (fixture.nativeElement.querySelector('.detail-menu-btn') as HTMLButtonElement).click();
    fixture.detectChanges();
    const labels = Array.from(
      fixture.nativeElement.querySelectorAll('.detail-menu-item') as NodeListOf<HTMLElement>,
    ).map((el) => el.textContent?.trim() ?? '');
    expect(labels.some((t) => t.includes('Send back to Concept'))).toBe(true);
    expect(labels.some((t) => t.includes('Archive'))).toBe(true);
    expect(labels.some((t) => t.includes('Duplicate'))).toBe(true);
    expect(labels.some((t) => t.includes('Delete'))).toBe(true);
  });

  it('hides "Send back to Concept" item when conceptId is not set', () => {
    const fixture = setup(makeItem({ conceptId: undefined }));
    (fixture.nativeElement.querySelector('.detail-menu-btn') as HTMLButtonElement).click();
    fixture.detectChanges();
    const labels = Array.from(
      fixture.nativeElement.querySelectorAll('.detail-menu-item') as NodeListOf<HTMLElement>,
    ).map((el) => el.textContent?.trim() ?? '');
    expect(labels.some((t) => t.includes('Send back to Concept'))).toBe(false);
  });

  it('clicking "Send back to Concept" emits backToConcept and closes the menu', () => {
    const fixture = setup(makeItem({ conceptId: 'c-42' }));
    let fired = 0;
    fixture.componentInstance.backToConcept.subscribe(() => fired++);
    (fixture.nativeElement.querySelector('.detail-menu-btn') as HTMLButtonElement).click();
    fixture.detectChanges();
    const items = Array.from(
      fixture.nativeElement.querySelectorAll('.detail-menu-item') as NodeListOf<HTMLButtonElement>,
    );
    items.find((b) => b.textContent?.includes('Send back to Concept'))!.click();
    expect(fired).toBe(1);
    expect(fixture.componentInstance['menuOpen']()).toBe(false);
  });

  it('Archive / Duplicate / Delete menu items emit their outputs', () => {
    const fixture = setup();
    let arc = 0;
    let dup = 0;
    let del = 0;
    fixture.componentInstance.archive.subscribe(() => arc++);
    fixture.componentInstance.duplicate.subscribe(() => dup++);
    fixture.componentInstance.deletePost.subscribe(() => del++);

    const open = (): HTMLButtonElement[] => {
      (fixture.nativeElement.querySelector('.detail-menu-btn') as HTMLButtonElement).click();
      fixture.detectChanges();
      return Array.from(
        fixture.nativeElement.querySelectorAll('.detail-menu-item') as NodeListOf<HTMLButtonElement>,
      );
    };

    open().find((b) => b.textContent?.includes('Archive'))!.click();
    expect(arc).toBe(1);
    open().find((b) => b.textContent?.includes('Duplicate'))!.click();
    expect(dup).toBe(1);
    open().find((b) => b.textContent?.includes('Delete'))!.click();
    expect(del).toBe(1);
  });

  it('Unarchive replaces Archive in the menu when item.archived is true', () => {
    const fixture = setup(makeItem({ archived: true }));
    let unarc = 0;
    fixture.componentInstance.unarchive.subscribe(() => unarc++);
    (fixture.nativeElement.querySelector('.detail-menu-btn') as HTMLButtonElement).click();
    fixture.detectChanges();
    const labels = Array.from(
      fixture.nativeElement.querySelectorAll('.detail-menu-item') as NodeListOf<HTMLElement>,
    ).map((el) => el.textContent?.trim() ?? '');
    expect(labels.some((t) => t.includes('Unarchive'))).toBe(true);
    expect(labels.some((t) => t === 'Archive')).toBe(false);
    Array.from(
      fixture.nativeElement.querySelectorAll('.detail-menu-item') as NodeListOf<HTMLButtonElement>,
    )
      .find((b) => b.textContent?.includes('Unarchive'))!
      .click();
    expect(unarc).toBe(1);
  });

  it('clicking outside the header closes the menu', () => {
    const fixture = setup();
    (fixture.nativeElement.querySelector('.detail-menu-btn') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.componentInstance['menuOpen']()).toBe(true);
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance['menuOpen']()).toBe(false);
  });

  it('titleChange passes the value through', () => {
    const fixture = setup();
    const emitted: string[] = [];
    fixture.componentInstance.titleChange.subscribe((v) => emitted.push(v));
    (fixture.componentInstance as unknown as { onTitleChange: (v: string) => void }).onTitleChange(
      'Renamed',
    );
    expect(emitted).toEqual(['Renamed']);
  });
});
