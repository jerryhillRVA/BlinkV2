import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  PkgHashtagBankComponent,
  type HashtagBankGroup,
} from './pkg-hashtag-bank.component';

interface SetupOptions {
  hashtags?: string[];
  disabled?: boolean;
  aiSuggesting?: boolean;
  groups?: HashtagBankGroup[];
}

const GROUPS: HashtagBankGroup[] = [
  { name: 'Yoga', tags: ['#yoga', '#yogalife'] },
  { name: 'Wellness', tags: ['#wellness', '#selfcare'] },
];

function setup(opts: SetupOptions = {}): ComponentFixture<PkgHashtagBankComponent> {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ imports: [PkgHashtagBankComponent] });
  const fixture = TestBed.createComponent(PkgHashtagBankComponent);
  fixture.componentRef.setInput('hashtags', opts.hashtags ?? []);
  fixture.componentRef.setInput('disabled', opts.disabled ?? false);
  fixture.componentRef.setInput('aiSuggesting', opts.aiSuggesting ?? false);
  fixture.componentRef.setInput('groups', opts.groups ?? []);
  fixture.detectChanges();
  return fixture;
}

describe('PkgHashtagBankComponent', () => {
  it('renders the "Hashtags" header label + AI Suggest button', () => {
    const fixture = setup();
    expect(fixture.nativeElement.querySelector('.bank-label')?.textContent).toBe('Hashtags');
    expect(fixture.nativeElement.querySelector('app-ai-button')).not.toBeNull();
  });

  it('shows empty-state copy when no hashtags are selected', () => {
    const fixture = setup({ hashtags: [] });
    const empty = fixture.nativeElement.querySelector('.empty-state') as HTMLElement;
    expect(empty?.textContent).toBe('No hashtags yet');
    expect(fixture.nativeElement.querySelector('.chip-row')).toBeNull();
  });

  it('renders chips when hashtags are present (no bordered container)', () => {
    const fixture = setup({ hashtags: ['#a', '#b'] });
    const chips = fixture.nativeElement.querySelectorAll('.chip');
    expect(chips.length).toBe(2);
    expect(fixture.nativeElement.querySelector('.empty-state')).toBeNull();
  });

  it('clicking a chip remove button emits hashtagsChange minus that chip', () => {
    const fixture = setup({ hashtags: ['#a', '#b', '#c'] });
    const emitted: string[][] = [];
    fixture.componentInstance.hashtagsChange.subscribe((v) => emitted.push(v));
    const btn = fixture.nativeElement.querySelectorAll('.chip-remove')[1] as HTMLButtonElement;
    btn.click();
    expect(emitted).toEqual([['#a', '#c']]);
  });

  it('typing + Enter in the add input commits the hashtag with auto-#-prefix', () => {
    const fixture = setup();
    const emitted: string[][] = [];
    fixture.componentInstance.hashtagsChange.subscribe((v) => emitted.push(v));
    const input = fixture.nativeElement.querySelector('.add-input') as HTMLInputElement;
    input.value = 'wellness';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(emitted).toEqual([['#wellness']]);
  });

  it('clicking the Add button commits the draft hashtag', () => {
    const fixture = setup();
    const emitted: string[][] = [];
    fixture.componentInstance.hashtagsChange.subscribe((v) => emitted.push(v));
    const input = fixture.nativeElement.querySelector('.add-input') as HTMLInputElement;
    input.value = '#fitness';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges(); // re-render Add button as enabled now that draft is non-empty
    const btn = fixture.nativeElement.querySelector('.add-btn') as HTMLButtonElement;
    btn.click();
    expect(emitted).toEqual([['#fitness']]);
  });

  it('Add button is disabled when input is empty / whitespace', () => {
    const fixture = setup();
    const btn = fixture.nativeElement.querySelector('.add-btn') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('duplicate hashtag commits clear the draft without emitting', () => {
    const fixture = setup({ hashtags: ['#wellness'] });
    const emitted: string[][] = [];
    fixture.componentInstance.hashtagsChange.subscribe((v) => emitted.push(v));
    const input = fixture.nativeElement.querySelector('.add-input') as HTMLInputElement;
    input.value = '#wellness';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(emitted).toEqual([]);
    expect(fixture.componentInstance['addInput']()).toBe('');
  });

  it('"View Full Bank" toggle is hidden when no groups are provided', () => {
    const fixture = setup({ groups: [] });
    expect(fixture.nativeElement.querySelector('.bank-toggle')).toBeNull();
  });

  it('"View Full Bank" toggle expands the group list when clicked', () => {
    const fixture = setup({ groups: GROUPS });
    expect(fixture.nativeElement.querySelector('.bank-groups')).toBeNull();
    const toggle = fixture.nativeElement.querySelector('.bank-toggle') as HTMLButtonElement;
    expect(toggle.textContent).toContain('View Full Bank');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    toggle.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.bank-groups')).not.toBeNull();
    expect(toggle.textContent).toContain('Hide Full Bank');
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
  });

  it('bank chips show group names and full tag set', () => {
    const fixture = setup({ groups: GROUPS });
    (fixture.nativeElement.querySelector('.bank-toggle') as HTMLButtonElement).click();
    fixture.detectChanges();
    const groupNames = Array.from(
      fixture.nativeElement.querySelectorAll('.bank-group-name') as NodeListOf<HTMLElement>,
    ).map((el) => el.textContent?.trim());
    expect(groupNames).toEqual(['Yoga', 'Wellness']);
    const chips = fixture.nativeElement.querySelectorAll('.bank-chip');
    expect(chips.length).toBe(4);
  });

  it('clicking a bank chip appends its tag to hashtags', () => {
    const fixture = setup({ groups: GROUPS, hashtags: [] });
    const emitted: string[][] = [];
    fixture.componentInstance.hashtagsChange.subscribe((v) => emitted.push(v));
    (fixture.nativeElement.querySelector('.bank-toggle') as HTMLButtonElement).click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.bank-chip') as HTMLButtonElement).click();
    expect(emitted).toEqual([['#yoga']]);
  });

  it('bank chips already in hashtags render with is-added class and are disabled', () => {
    const fixture = setup({ groups: GROUPS, hashtags: ['#yoga'] });
    (fixture.nativeElement.querySelector('.bank-toggle') as HTMLButtonElement).click();
    fixture.detectChanges();
    const firstChip = fixture.nativeElement.querySelector('.bank-chip') as HTMLButtonElement;
    expect(firstChip.classList.contains('is-added')).toBe(true);
    expect(firstChip.disabled).toBe(true);
  });

  it('AI Suggest button emits aiSuggest when clicked', () => {
    const fixture = setup();
    let fired = 0;
    fixture.componentInstance.aiSuggest.subscribe(() => fired++);
    fixture.componentInstance['onSuggestClick']();
    expect(fired).toBe(1);
  });

  it('AI Suggest is a no-op while disabled or already suggesting', () => {
    const a = setup({ disabled: true });
    let fa = 0;
    a.componentInstance.aiSuggest.subscribe(() => fa++);
    a.componentInstance['onSuggestClick']();
    expect(fa).toBe(0);

    const b = setup({ aiSuggesting: true });
    let fb = 0;
    b.componentInstance.aiSuggest.subscribe(() => fb++);
    b.componentInstance['onSuggestClick']();
    expect(fb).toBe(0);
  });

  it('non-Enter keydown is a no-op (Tab, etc.)', () => {
    const fixture = setup();
    const emitted: string[][] = [];
    fixture.componentInstance.hashtagsChange.subscribe((v) => emitted.push(v));
    const input = fixture.nativeElement.querySelector('.add-input') as HTMLInputElement;
    input.value = 'wellness';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(emitted).toEqual([]);
  });

  it('commitDraft is a no-op when disabled (Enter does nothing)', () => {
    const fixture = setup({ disabled: true });
    const emitted: string[][] = [];
    fixture.componentInstance.hashtagsChange.subscribe((v) => emitted.push(v));
    fixture.componentInstance['addInput'].set('blocked');
    fixture.componentInstance['onAddKeydown'](
      new KeyboardEvent('keydown', { key: 'Enter' }),
    );
    expect(emitted).toEqual([]);
  });

  it('chip remove is a no-op when component is disabled', () => {
    const fixture = setup({ hashtags: ['#a'], disabled: true });
    const emitted: string[][] = [];
    fixture.componentInstance.hashtagsChange.subscribe((v) => emitted.push(v));
    fixture.componentInstance['onChipRemove']('#a');
    expect(emitted).toEqual([]);
  });

  it('bank chip click is a no-op when the tag is already in hashtags', () => {
    const fixture = setup({ groups: GROUPS, hashtags: ['#yoga'] });
    const emitted: string[][] = [];
    fixture.componentInstance.hashtagsChange.subscribe((v) => emitted.push(v));
    fixture.componentInstance['onBankChipClick']('#yoga');
    expect(emitted).toEqual([]);
  });

  it('bank chip click is a no-op when component is disabled', () => {
    const fixture = setup({ groups: GROUPS, hashtags: [], disabled: true });
    const emitted: string[][] = [];
    fixture.componentInstance.hashtagsChange.subscribe((v) => emitted.push(v));
    fixture.componentInstance['onBankChipClick']('#yoga');
    expect(emitted).toEqual([]);
  });

  it('an already-#-prefixed hashtag is committed as-is (no double-prefix)', () => {
    const fixture = setup();
    const emitted: string[][] = [];
    fixture.componentInstance.hashtagsChange.subscribe((v) => emitted.push(v));
    fixture.componentInstance['addInput'].set('#prefixed');
    fixture.componentInstance['onAddKeydown'](
      new KeyboardEvent('keydown', { key: 'Enter' }),
    );
    expect(emitted).toEqual([['#prefixed']]);
  });

  it('whitespace-only Enter is a no-op (does not emit empty hashtag)', () => {
    const fixture = setup();
    const emitted: string[][] = [];
    fixture.componentInstance.hashtagsChange.subscribe((v) => emitted.push(v));
    fixture.componentInstance['addInput'].set('   ');
    fixture.componentInstance['onAddKeydown'](
      new KeyboardEvent('keydown', { key: 'Enter' }),
    );
    expect(emitted).toEqual([]);
  });

  it('disabled state: chip-remove + bank chips + add input + add button all read-only / disabled', () => {
    const fixture = setup({ hashtags: ['#a'], groups: GROUPS, disabled: true });
    (fixture.nativeElement.querySelector('.bank-toggle') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(
      (fixture.nativeElement.querySelector('.chip-remove') as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(
      (fixture.nativeElement.querySelector('.add-input') as HTMLInputElement).disabled,
    ).toBe(true);
    expect(
      (fixture.nativeElement.querySelector('.add-btn') as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(
      (fixture.nativeElement.querySelectorAll('.bank-chip')[1] as HTMLButtonElement).disabled,
    ).toBe(true);
  });
});
