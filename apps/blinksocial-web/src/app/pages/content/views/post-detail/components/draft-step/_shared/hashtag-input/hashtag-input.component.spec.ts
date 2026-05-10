import { TestBed } from '@angular/core/testing';
import { HashtagInputComponent } from './hashtag-input.component';

function setup(initial: Partial<HashtagInputComponent> = {}) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ imports: [HashtagInputComponent] });
  const fixture = TestBed.createComponent(HashtagInputComponent);
  Object.assign(fixture.componentInstance, initial);
  fixture.detectChanges();
  return fixture;
}

describe('HashtagInputComponent', () => {
  it('renders <ul role="list"> with aria-live and aria-label including count', () => {
    const fixture = setup({ hashtags: ['#a', '#b'] });
    const list = fixture.nativeElement.querySelector('ul.chip-list');
    expect(list.getAttribute('role')).toBe('list');
    expect(list.getAttribute('aria-live')).toBe('polite');
    expect(list.getAttribute('aria-label')).toBe('Hashtags: 2');
  });

  it('each chip remove button has aria-label "Remove hashtag #X"', () => {
    const fixture = setup({ hashtags: ['#a', '#b'] });
    const buttons = fixture.nativeElement.querySelectorAll('.chip-remove');
    expect(buttons[0].getAttribute('aria-label')).toBe('Remove hashtag #a');
    expect(buttons[1].getAttribute('aria-label')).toBe('Remove hashtag #b');
  });

  it('Enter on the input adds the typed hashtag', () => {
    const fixture = setup({ hashtags: ['#a'] });
    const events: string[][] = [];
    fixture.componentInstance.hashtagsChange.subscribe((v) => events.push(v));
    const input = fixture.nativeElement.querySelector(
      'input.chip-input',
    ) as HTMLInputElement;
    fixture.componentInstance['draft'].set('newtag');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(events).toEqual([['#a', '#newtag']]);
  });

  it('prepends # automatically when missing', () => {
    const fixture = setup({ hashtags: [] });
    const events: string[][] = [];
    fixture.componentInstance.hashtagsChange.subscribe((v) => events.push(v));
    fixture.componentInstance['draft'].set('yoga');
    fixture.componentInstance['onSubmit']();
    expect(events).toEqual([['#yoga']]);
  });

  it('does not duplicate an existing tag', () => {
    const fixture = setup({ hashtags: ['#a'] });
    const events: string[][] = [];
    fixture.componentInstance.hashtagsChange.subscribe((v) => events.push(v));
    fixture.componentInstance['draft'].set('a');
    fixture.componentInstance['onSubmit']();
    expect(events).toEqual([]);
  });

  it('Backspace on empty input removes the last chip', () => {
    const fixture = setup({ hashtags: ['#a', '#b', '#c'] });
    const events: string[][] = [];
    fixture.componentInstance.hashtagsChange.subscribe((v) => events.push(v));
    const input = fixture.nativeElement.querySelector(
      'input.chip-input',
    ) as HTMLInputElement;
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }));
    expect(events).toEqual([['#a', '#b']]);
  });

  it('Remove button on a chip emits hashtagsChange minus that tag', () => {
    const fixture = setup({ hashtags: ['#a', '#b'] });
    const events: string[][] = [];
    fixture.componentInstance.hashtagsChange.subscribe((v) => events.push(v));
    const btn = fixture.nativeElement.querySelectorAll(
      '.chip-remove',
    )[0] as HTMLButtonElement;
    btn.click();
    expect(events).toEqual([['#b']]);
  });

  it('AI suggested chip click adds it; another click is a no-op (already in list)', () => {
    const fixture = setup({ hashtags: ['#yoga'] });
    fixture.componentInstance['toggleBank']();
    fixture.detectChanges();
    const events: string[][] = [];
    fixture.componentInstance.hashtagsChange.subscribe((v) => events.push(v));
    fixture.componentInstance['onSuggested']('#wellness40');
    fixture.componentInstance['onSuggested']('#yoga');
    expect(events).toEqual([['#yoga', '#wellness40']]);
  });

  it('bank toggle flips aria-expanded on the toggle button', () => {
    const fixture = setup();
    const toggle = fixture.nativeElement.querySelector(
      '.bank-toggle',
    ) as HTMLButtonElement;
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    toggle.click();
    fixture.detectChanges();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
  });

  it('all writes are no-ops when disabled', () => {
    const fixture = setup({ hashtags: ['#a'], disabled: true });
    const events: string[][] = [];
    fixture.componentInstance.hashtagsChange.subscribe((v) => events.push(v));
    fixture.componentInstance['draft'].set('newtag');
    fixture.componentInstance['onSubmit']();
    fixture.componentInstance['onRemove']('#a');
    fixture.componentInstance['onSuggested']('#yoga');
    expect(events).toEqual([]);
  });
});
