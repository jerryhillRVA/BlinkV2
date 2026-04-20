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
  it('renders back, Pipeline stage badge, inline title, Saved, and menu button', () => {
    const fixture = setup();
    expect(fixture.nativeElement.querySelector('.detail-back')).not.toBeNull();
    const badge = fixture.nativeElement.querySelector('.stage-badge') as HTMLElement;
    expect(badge.classList.contains('stage-pipeline')).toBe(true);
    expect(badge.textContent?.trim()).toContain('In Production');
    expect(fixture.nativeElement.querySelector('app-inline-edit')).not.toBeNull();
    expect(
      (fixture.nativeElement.querySelector('.detail-saved') as HTMLElement).textContent?.trim(),
    ).toBe('Saved');
    expect(fixture.nativeElement.querySelector('.detail-menu-btn')).not.toBeNull();
  });

  it('renders platform + contentType meta when both set', () => {
    const fixture = setup(makeItem({ platform: 'instagram', contentType: 'reel' }));
    const chip = fixture.nativeElement.querySelector('.detail-platform') as HTMLElement;
    expect(chip.textContent).toContain('Instagram');
    expect(chip.textContent).toContain('Reel');
  });

  it('hides platform chip when platform is unset', () => {
    const fixture = setup(makeItem({ platform: undefined }));
    expect(fixture.nativeElement.querySelector('.detail-platform')).toBeNull();
  });

  it('hides "Back to Concept" button when conceptId is not set', () => {
    const fixture = setup(makeItem({ conceptId: undefined }));
    expect(fixture.nativeElement.querySelector('.btn-back-to-concept')).toBeNull();
  });

  it('shows "Back to Concept" button when conceptId is set', () => {
    const fixture = setup(makeItem({ conceptId: 'c-42' }));
    expect(fixture.nativeElement.querySelector('.btn-back-to-concept')).not.toBeNull();
  });

  it('emits back when the back button is clicked', () => {
    const fixture = setup();
    let fired = 0;
    fixture.componentInstance.back.subscribe(() => fired++);
    (fixture.nativeElement.querySelector('.detail-back') as HTMLButtonElement).click();
    expect(fired).toBe(1);
  });

  it('emits backToConcept when the link is clicked', () => {
    const fixture = setup(makeItem({ conceptId: 'c-42' }));
    let fired = 0;
    fixture.componentInstance.backToConcept.subscribe(() => fired++);
    (fixture.nativeElement.querySelector('.btn-back-to-concept') as HTMLButtonElement).click();
    expect(fired).toBe(1);
  });

  it('menu: Archive / Duplicate / Delete emit their outputs and close the menu', () => {
    const fixture = setup();
    let arc = 0;
    let dup = 0;
    let del = 0;
    fixture.componentInstance.archive.subscribe(() => arc++);
    fixture.componentInstance.duplicate.subscribe(() => dup++);
    fixture.componentInstance.deletePost.subscribe(() => del++);

    (fixture.nativeElement.querySelector('.detail-menu-btn') as HTMLButtonElement).click();
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll(
      '.detail-menu-item',
    ) as NodeListOf<HTMLButtonElement>;
    expect(items.length).toBe(3);
    items[0].click();
    expect(arc).toBe(1);

    (fixture.nativeElement.querySelector('.detail-menu-btn') as HTMLButtonElement).click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelectorAll('.detail-menu-item')[1] as HTMLButtonElement).click();
    expect(dup).toBe(1);

    (fixture.nativeElement.querySelector('.detail-menu-btn') as HTMLButtonElement).click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelectorAll('.detail-menu-item')[2] as HTMLButtonElement).click();
    expect(del).toBe(1);
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

  it('platformLabel returns null for unknown platform', () => {
    const fixture = setup(makeItem({ platform: 'mystery' as never }));
    const comp = fixture.componentInstance as unknown as {
      platformLabel: () => string | null;
    };
    expect(comp.platformLabel()).toBeNull();
  });

  it('contentTypeLabel returns null when platform is missing', () => {
    const fixture = setup(makeItem({ platform: undefined }));
    const comp = fixture.componentInstance as unknown as {
      contentTypeLabel: () => string | null;
    };
    expect(comp.contentTypeLabel()).toBeNull();
  });

  it('contentTypeLabel returns null when contentType is missing but platform is set', () => {
    const fixture = setup(makeItem({ platform: 'instagram', contentType: undefined }));
    const comp = fixture.componentInstance as unknown as {
      contentTypeLabel: () => string | null;
    };
    expect(comp.contentTypeLabel()).toBeNull();
  });

  it('contentTypeLabel returns null when contentType is not in the platform map', () => {
    const fixture = setup(
      makeItem({ platform: 'instagram', contentType: 'long-form' }),
    );
    const comp = fixture.componentInstance as unknown as {
      contentTypeLabel: () => string | null;
    };
    expect(comp.contentTypeLabel()).toBeNull();
  });
});
