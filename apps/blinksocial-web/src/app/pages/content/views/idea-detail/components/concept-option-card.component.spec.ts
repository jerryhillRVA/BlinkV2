import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConceptOptionCardComponent } from './concept-option-card.component';
import type { ConceptOption } from '../idea-detail.types';
import type { AudienceSegment, ContentPillar } from '../../../content.types';

const PILLARS: ContentPillar[] = [
  { id: 'p1', name: 'Alpha', description: '', color: '#111' },
  { id: 'p2', name: 'Beta', description: '', color: '#224466' },
];
const SEGMENTS: AudienceSegment[] = [
  { id: 's1', name: 'Seg1', description: '' },
];

const OPT: ConceptOption = {
  id: 'opt-1',
  angle: 'Angle line',
  description: 'Description text',
  objectiveAlignment: 'Alignment',
  objective: 'engagement',
  pillarIds: ['p1', 'p2'],
  segmentIds: ['s1'],
  productionTargets: [{ platform: 'instagram', contentType: 'reel' }],
  cta: { type: 'comment', text: 'Drop a comment' },
  suggestedFormatLabel: 'Reel',
};

function setup(selected = false): ComponentFixture<ConceptOptionCardComponent> {
  TestBed.configureTestingModule({ imports: [ConceptOptionCardComponent] });
  const fixture = TestBed.createComponent(ConceptOptionCardComponent);
  fixture.componentRef.setInput('option', OPT);
  fixture.componentRef.setInput('pillars', PILLARS);
  fixture.componentRef.setInput('segments', SEGMENTS);
  fixture.componentRef.setInput('selected', selected);
  fixture.detectChanges();
  return fixture;
}

describe('ConceptOptionCardComponent', () => {
  it('renders the angle, description, and cta text', () => {
    const fixture = setup();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Angle line');
    expect(text).toContain('Description text');
    expect(text).toContain('Drop a comment');
  });

  it('labels the cta section "CTA:" (with a colon) and renders the cta text inline on the same line', () => {
    const fixture = setup();
    const ctaRow = fixture.nativeElement.querySelector('.option-cta-row') as HTMLElement;
    expect(ctaRow).not.toBeNull();
    const label = ctaRow.querySelector('.option-meta-label') as HTMLElement;
    expect(label.textContent?.trim()).toBe('CTA:');
    expect(ctaRow.textContent).toContain('Drop a comment');
    // flex-direction must be row for inline layout (not the default column)
    expect(getComputedStyle(ctaRow).flexDirection).toBe('row');
  });

  it('labels the format section "Format:" (with a colon) and renders the suggestedFormatLabel inline, no icons', () => {
    const fixture = setup();
    const formatRow = fixture.nativeElement.querySelector('.option-format-row') as HTMLElement;
    expect(formatRow).not.toBeNull();
    const label = formatRow.querySelector('.option-meta-label') as HTMLElement;
    expect(label.textContent?.trim()).toBe('Format:');
    expect(formatRow.textContent).toContain('Reel');
    expect(formatRow.querySelector('app-platform-icon')).toBeNull();
    expect(formatRow.querySelector('.option-target')).toBeNull();
  });

  it('renders the Objective Alignment section with the option.objectiveAlignment value', () => {
    const fixture = setup();
    const labels = Array.from(
      fixture.nativeElement.querySelectorAll('.option-meta-label') as NodeListOf<HTMLElement>,
    ).map((el) => el.textContent?.trim());
    expect(labels).toContain('Objective Alignment');
    expect((fixture.nativeElement.textContent as string)).toContain('Alignment');
  });

  it('paints each pillar chip with that pillar’s own color (text + border + background tint)', () => {
    const fixture = setup();
    const pillarChips = fixture.nativeElement.querySelectorAll(
      '.option-pillar-chip',
    ) as NodeListOf<HTMLElement>;
    expect(pillarChips.length).toBe(2);
    expect(pillarChips[0].style.color).toBe('rgb(17, 17, 17)');
    expect(pillarChips[1].style.color).toBe('rgb(34, 68, 102)');
    expect(pillarChips[0].style.borderColor).toBe('rgba(17, 17, 17, 0.25)');
    expect(pillarChips[0].style.backgroundColor).toBe('rgba(17, 17, 17, 0.08)');
  });

  it('pillarChipStyles returns the raw color verbatim when it is not a valid hex', () => {
    const fixture = setup();
    const comp = fixture.componentInstance as unknown as {
      pillarChipStyles: (color: string) => Record<string, string>;
    };
    const styles = comp.pillarChipStyles('not-a-hex');
    expect(styles['color']).toBe('not-a-hex');
    expect(styles['border-color']).toBe('not-a-hex');
    expect(styles['background-color']).toBe('not-a-hex');
  });

  it('audience chips use a dedicated audience style class (not the orange brand chip)', () => {
    const fixture = setup();
    const audienceChip = fixture.nativeElement.querySelector('.option-audience-chip');
    expect(audienceChip).not.toBeNull();
  });

  it('resolves pillar + segment names for the given ids', () => {
    const fixture = setup();
    const allChips = Array.from(
      fixture.nativeElement.querySelectorAll(
        '.option-pillar-chip, .option-audience-chip',
      ) as NodeListOf<HTMLElement>,
    ).map((el) => el.textContent?.trim());
    expect(allChips).toContain('Alpha');
    expect(allChips).toContain('Beta');
    expect(allChips).toContain('Seg1');
  });

  it('omits chips when no matching pillar/segment exists', () => {
    const fixture = setup();
    fixture.componentRef.setInput('pillars', []);
    fixture.componentRef.setInput('segments', []);
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelectorAll('.option-pillar-chip, .option-audience-chip').length,
    ).toBe(0);
  });

  it('applies is-selected class and shows the top-right checkmark when selected', () => {
    const fixture = setup(true);
    const card = fixture.nativeElement.querySelector('.option-card') as HTMLButtonElement;
    expect(card.classList.contains('is-selected')).toBe(true);
    expect(card.getAttribute('aria-pressed')).toBe('true');
    expect(card.querySelector('.option-selected-mark')).not.toBeNull();
    expect(card.querySelector('.option-selected-mark svg')).not.toBeNull();
  });

  it('does not render a checkbox or checkmark when unselected', () => {
    const fixture = setup(false);
    const card = fixture.nativeElement.querySelector('.option-card') as HTMLButtonElement;
    expect(card.querySelector('.option-selected-mark')).toBeNull();
    expect(card.querySelector('.option-check')).toBeNull();
  });

  it('reserves right padding on the title so text never slides under the selected-mark', () => {
    const fixture = setup(false);
    const angle = fixture.nativeElement.querySelector('.option-angle') as HTMLElement;
    const padding = getComputedStyle(angle).paddingRight;
    const px = parseFloat(padding);
    expect(px).toBeGreaterThanOrEqual(28);
  });

  it('title padding is identical whether selected or unselected (no layout shift on click)', () => {
    const fixture = setup(false);
    const angle = fixture.nativeElement.querySelector('.option-angle') as HTMLElement;
    const paddingA = getComputedStyle(angle).paddingRight;
    fixture.componentRef.setInput('selected', true);
    fixture.detectChanges();
    const paddingB = getComputedStyle(angle).paddingRight;
    expect(paddingA).toBe(paddingB);
  });

  it('clicking the card emits toggle with the option id', () => {
    const fixture = setup();
    const emitted: string[] = [];
    fixture.componentInstance.selectOption.subscribe((id) => emitted.push(id));
    (fixture.nativeElement.querySelector('.option-card') as HTMLButtonElement).click();
    expect(emitted).toEqual(['opt-1']);
  });

});
