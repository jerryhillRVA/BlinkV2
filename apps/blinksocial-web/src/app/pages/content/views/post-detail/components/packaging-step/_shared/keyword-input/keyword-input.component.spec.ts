import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KeywordInputComponent } from './keyword-input.component';

interface SetupOptions {
  keywords?: string[];
  aiSuggestions?: string[];
  disabled?: boolean;
}

function setup(opts: SetupOptions = {}): ComponentFixture<KeywordInputComponent> {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ imports: [KeywordInputComponent] });
  const fixture = TestBed.createComponent(KeywordInputComponent);
  fixture.componentRef.setInput('keywords', opts.keywords ?? []);
  fixture.componentRef.setInput('aiSuggestions', opts.aiSuggestions ?? []);
  fixture.componentRef.setInput('disabled', opts.disabled ?? false);
  fixture.detectChanges();
  return fixture;
}

describe('KeywordInputComponent', () => {
  it('Enter on the input adds a typed keyword', () => {
    const fixture = setup({ keywords: ['alpha'] });
    const emitted: string[][] = [];
    fixture.componentInstance.keywordsChange.subscribe((v) => emitted.push(v));
    fixture.componentInstance['draft'].set('beta');
    const input = fixture.nativeElement.querySelector('.kw-input') as HTMLInputElement;
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(emitted).toEqual([['alpha', 'beta']]);
  });

  it('trims whitespace when committing', () => {
    const fixture = setup();
    const emitted: string[][] = [];
    fixture.componentInstance.keywordsChange.subscribe((v) => emitted.push(v));
    fixture.componentInstance['draft'].set('  spaced  ');
    fixture.componentInstance['commitDraft']();
    expect(emitted).toEqual([['spaced']]);
  });

  it('dedupes case-insensitively (rejects duplicate)', () => {
    const fixture = setup({ keywords: ['Yoga'] });
    const emitted: string[][] = [];
    fixture.componentInstance.keywordsChange.subscribe((v) => emitted.push(v));
    fixture.componentInstance['draft'].set('yoga');
    fixture.componentInstance['commitDraft']();
    expect(emitted).toEqual([]);
    expect(fixture.componentInstance['draft']()).toBe('');
  });

  it('chip remove button has the aria-label "Remove keyword <kw>" and removes the chip on click', () => {
    const fixture = setup({ keywords: ['alpha', 'beta'] });
    const emitted: string[][] = [];
    fixture.componentInstance.keywordsChange.subscribe((v) => emitted.push(v));
    const btn = fixture.nativeElement.querySelectorAll('.chip-remove')[0] as HTMLButtonElement;
    expect(btn.getAttribute('aria-label')).toBe('Remove keyword alpha');
    btn.click();
    expect(emitted).toEqual([['beta']]);
  });

  it('Backspace on an empty input removes the last chip', () => {
    const fixture = setup({ keywords: ['alpha', 'beta'] });
    const emitted: string[][] = [];
    fixture.componentInstance.keywordsChange.subscribe((v) => emitted.push(v));
    const input = fixture.nativeElement.querySelector('.kw-input') as HTMLInputElement;
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }));
    expect(emitted).toEqual([['alpha']]);
  });

  it('Backspace with text in the draft does not remove a chip', () => {
    const fixture = setup({ keywords: ['alpha'] });
    const emitted: string[][] = [];
    fixture.componentInstance.keywordsChange.subscribe((v) => emitted.push(v));
    fixture.componentInstance['draft'].set('typing');
    fixture.componentInstance['onKeydown'](new KeyboardEvent('keydown', { key: 'Backspace' }));
    expect(emitted).toEqual([]);
  });

  it('clicking an AI-suggestion chip appends it; clicking again is a no-op', () => {
    const fixture = setup({ keywords: ['existing'], aiSuggestions: ['existing', 'fresh'] });
    const emitted: string[][] = [];
    fixture.componentInstance.keywordsChange.subscribe((v) => emitted.push(v));
    fixture.componentInstance['onSuggestion']('fresh');
    fixture.componentInstance['onSuggestion']('existing');
    expect(emitted).toEqual([['existing', 'fresh']]);
  });

  it('disabled state makes the input read-only and disables chip remove buttons', () => {
    const fixture = setup({ keywords: ['alpha'], disabled: true });
    const input = fixture.nativeElement.querySelector('.kw-input') as HTMLInputElement;
    expect(input.readOnly).toBe(true);
    const btn = fixture.nativeElement.querySelector('.chip-remove') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('all writes are no-ops when disabled', () => {
    const fixture = setup({ keywords: ['alpha'], disabled: true });
    const emitted: string[][] = [];
    fixture.componentInstance.keywordsChange.subscribe((v) => emitted.push(v));
    fixture.componentInstance['draft'].set('attempted');
    fixture.componentInstance['onKeydown'](new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.componentInstance['onRemove']('alpha');
    fixture.componentInstance['onSuggestion']('anything');
    expect(emitted).toEqual([]);
  });

  it('empty draft commit is a no-op', () => {
    const fixture = setup();
    const emitted: string[][] = [];
    fixture.componentInstance.keywordsChange.subscribe((v) => emitted.push(v));
    fixture.componentInstance['draft'].set('   ');
    fixture.componentInstance['commitDraft']();
    expect(emitted).toEqual([]);
  });

  it('non-Enter / non-Backspace keys are ignored', () => {
    const fixture = setup({ keywords: ['a'] });
    const emitted: string[][] = [];
    fixture.componentInstance.keywordsChange.subscribe((v) => emitted.push(v));
    fixture.componentInstance['onKeydown'](new KeyboardEvent('keydown', { key: 'Tab' }));
    expect(emitted).toEqual([]);
  });

  it('Backspace from empty input with no keywords is a no-op (covers empty-list guard)', () => {
    const fixture = setup({ keywords: [] });
    const emitted: string[][] = [];
    fixture.componentInstance.keywordsChange.subscribe((v) => emitted.push(v));
    fixture.componentInstance['onKeydown'](new KeyboardEvent('keydown', { key: 'Backspace' }));
    expect(emitted).toEqual([]);
  });
});
