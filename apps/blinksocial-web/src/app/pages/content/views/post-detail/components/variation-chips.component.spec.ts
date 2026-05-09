import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VariationChipsComponent } from './variation-chips.component';
import type { ContentItem } from '../../../content.types';

function makeItem(partial: Partial<ContentItem> = {}): ContentItem {
  const now = new Date().toISOString();
  return {
    id: 'p-1',
    conceptId: 'c-1',
    stage: 'post',
    status: 'in-progress',
    title: 'Variation 1',
    description: '',
    pillarIds: [],
    segmentIds: [],
    platform: 'instagram',
    contentType: 'reel',
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

function setup(
  items: ContentItem[],
  activeId: string,
): ComponentFixture<VariationChipsComponent> {
  TestBed.configureTestingModule({ imports: [VariationChipsComponent] });
  const fixture = TestBed.createComponent(VariationChipsComponent);
  fixture.componentRef.setInput('items', items);
  fixture.componentRef.setInput('activeId', activeId);
  fixture.detectChanges();
  return fixture;
}

describe('VariationChipsComponent', () => {
  it('renders nothing when there is only one variation', () => {
    const fixture = setup([makeItem()], 'p-1');
    expect(fixture.nativeElement.querySelector('.variations-bar')).toBeNull();
  });

  it('renders one chip per variation when 2+ siblings exist', () => {
    const fixture = setup(
      [
        makeItem({ id: 'p-1', platform: 'instagram', contentType: 'reel' }),
        makeItem({ id: 'p-2', platform: 'tiktok', contentType: 'short-video' }),
      ],
      'p-1',
    );
    expect(fixture.nativeElement.querySelectorAll('.variation-chip').length).toBe(2);
  });

  it('marks the active variation with is-active and aria-selected="true"', () => {
    const fixture = setup(
      [
        makeItem({ id: 'p-1', platform: 'instagram' }),
        makeItem({ id: 'p-2', platform: 'tiktok', contentType: 'short-video' }),
      ],
      'p-2',
    );
    const chips = fixture.nativeElement.querySelectorAll('.variation-chip');
    expect(chips[0].classList.contains('is-active')).toBe(false);
    expect(chips[1].classList.contains('is-active')).toBe(true);
    expect(chips[1].getAttribute('aria-selected')).toBe('true');
  });

  it('clicking a sibling chip emits open with that id; clicking active is a noop', () => {
    const fixture = setup(
      [
        makeItem({ id: 'p-1' }),
        makeItem({ id: 'p-2', platform: 'youtube', contentType: 'long-form' }),
      ],
      'p-1',
    );
    const emitted: string[] = [];
    fixture.componentInstance.open.subscribe((id) => emitted.push(id));
    const chips = fixture.nativeElement.querySelectorAll(
      '.variation-chip',
    ) as NodeListOf<HTMLButtonElement>;
    chips[1].click();
    expect(emitted).toEqual(['p-2']);
    chips[0].click(); // active button is disabled, no event
    expect(emitted).toEqual(['p-2']);
  });

  it('falls back gracefully when platform / contentType is undefined', () => {
    const fixture = setup(
      [
        makeItem({ id: 'p-1', platform: undefined, contentType: undefined }),
        makeItem({ id: 'p-2', platform: 'tiktok', contentType: 'short-video' }),
      ],
      'p-1',
    );
    const labels = Array.from(
      fixture.nativeElement.querySelectorAll('.variation-chip-label') as NodeListOf<HTMLElement>,
    ).map((el) => el.textContent?.trim());
    expect(labels[0]).toBe('Unknown');
    expect(labels[1]).toContain('Tik');
  });
});
