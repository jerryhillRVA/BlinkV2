import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConceptDetailHeaderComponent } from './concept-detail-header.component';
import type { ContentItem } from '../../../content.types';

function makeItem(partial: Partial<ContentItem> = {}): ContentItem {
  const now = new Date().toISOString();
  return {
    id: 'c-1',
    stage: 'concept',
    status: 'draft',
    title: 'A shapeable concept',
    description: '',
    pillarIds: [],
    segmentIds: [],
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

function setup(
  canMove = true,
  item: ContentItem = makeItem(),
): ComponentFixture<ConceptDetailHeaderComponent> {
  TestBed.configureTestingModule({ imports: [ConceptDetailHeaderComponent] });
  const fixture = TestBed.createComponent(ConceptDetailHeaderComponent);
  fixture.componentRef.setInput('item', item);
  fixture.componentRef.setInput('canMoveToProduction', canMove);
  fixture.detectChanges();
  return fixture;
}

describe('ConceptDetailHeaderComponent', () => {
  it('renders Back, Concept badge, inline title, Saved indicator, and primary CTA', () => {
    const fixture = setup();
    expect(fixture.nativeElement.querySelector('.detail-back')).not.toBeNull();
    const badge = fixture.nativeElement.querySelector('.stage-badge') as HTMLElement;
    expect(badge.classList.contains('stage-concept')).toBe(true);
    expect(badge.textContent?.trim()).toContain('Concept');
    expect(fixture.nativeElement.querySelector('app-inline-edit')).not.toBeNull();
    const saved = fixture.nativeElement.querySelector('.detail-saved') as HTMLElement;
    expect(saved.textContent?.trim()).toBe('Saved');
    const cta = fixture.nativeElement.querySelector('.btn-advance') as HTMLButtonElement;
    expect(cta.textContent).toContain('Move to Production');
  });

  it('primary CTA is disabled when canMoveToProduction is false', () => {
    const fixture = setup(false);
    const cta = fixture.nativeElement.querySelector('.btn-advance') as HTMLButtonElement;
    expect(cta.disabled).toBe(true);
  });

  it('clicking CTA emits moveToProduction when enabled, not when disabled', () => {
    const fixture = setup(true);
    const emitted: number[] = [];
    fixture.componentInstance.moveToProduction.subscribe(() => emitted.push(1));
    (fixture.nativeElement.querySelector('.btn-advance') as HTMLButtonElement).click();
    expect(emitted.length).toBe(1);

    fixture.componentRef.setInput('canMoveToProduction', false);
    fixture.detectChanges();
    // Even calling the handler directly should be a no-op
    (fixture.componentInstance as unknown as { onMoveToProduction: () => void }).onMoveToProduction();
    expect(emitted.length).toBe(1);
  });

  it('Back button emits back', () => {
    const fixture = setup();
    let count = 0;
    fixture.componentInstance.back.subscribe(() => count++);
    (fixture.nativeElement.querySelector('.detail-back') as HTMLButtonElement).click();
    expect(count).toBe(1);
  });

  it('hides platform chip when platform is unset', () => {
    const fixture = setup(true, makeItem({ platform: undefined }));
    expect(fixture.nativeElement.querySelector('.detail-platform')).toBeNull();
  });

  it('renders platform + contentType meta when both set', () => {
    const fixture = setup(true, makeItem({ platform: 'instagram', contentType: 'reel' }));
    const chip = fixture.nativeElement.querySelector('.detail-platform') as HTMLElement;
    expect(chip.textContent).toContain('Instagram');
    expect(chip.textContent).toContain('Reel');
  });

  it('menu opens; Send back to Idea emits demoteToIdea and closes', () => {
    const fixture = setup();
    let demoted = 0;
    fixture.componentInstance.demoteToIdea.subscribe(() => demoted++);
    (fixture.nativeElement.querySelector('.detail-menu-btn') as HTMLButtonElement).click();
    fixture.detectChanges();
    const demoteBtn = Array.from(
      fixture.nativeElement.querySelectorAll('.detail-menu-item') as NodeListOf<HTMLButtonElement>,
    ).find((b) => b.textContent?.includes('Send back to Idea')) as HTMLButtonElement;
    demoteBtn.click();
    expect(demoted).toBe(1);
    expect(fixture.componentInstance['menuOpen']()).toBe(false);
  });

  it('menu Delete emits deleteConcept', () => {
    const fixture = setup();
    let deleted = 0;
    fixture.componentInstance.deleteConcept.subscribe(() => deleted++);
    (fixture.nativeElement.querySelector('.detail-menu-btn') as HTMLButtonElement).click();
    fixture.detectChanges();
    const delBtn = Array.from(
      fixture.nativeElement.querySelectorAll('.detail-menu-item') as NodeListOf<HTMLButtonElement>,
    ).find((b) => b.textContent?.includes('Delete')) as HTMLButtonElement;
    delBtn.click();
    expect(deleted).toBe(1);
  });

  it('titleChange emits when inline edit commits', () => {
    const fixture = setup();
    const emitted: string[] = [];
    fixture.componentInstance.titleChange.subscribe((v) => emitted.push(v));
    (fixture.componentInstance as unknown as { onTitleChange: (v: string) => void }).onTitleChange('New');
    expect(emitted).toEqual(['New']);
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

  it('platformLabel returns null for unknown platform', () => {
    const fixture = setup(true, makeItem({ platform: 'mystery' as never }));
    const comp = fixture.componentInstance as unknown as {
      platformLabel: () => string | null;
    };
    expect(comp.platformLabel()).toBeNull();
  });

  it('contentTypeLabel returns null when platform missing', () => {
    const fixture = setup(true, makeItem({ platform: undefined }));
    const comp = fixture.componentInstance as unknown as {
      contentTypeLabel: () => string | null;
    };
    expect(comp.contentTypeLabel()).toBeNull();
  });
});
