import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { ContentTypePickerComponent } from './content-type-picker.component';
import type { ContentItemType } from '../../../content.types';

@Component({
  imports: [ContentTypePickerComponent],
  template: `
    <div class="anchor">
      <button class="trigger">Trigger</button>
      <app-content-type-picker
        [open]="open"
        (selected)="picked = $event"
        (dismissed)="dismissed = dismissed + 1"
      />
    </div>
    <button class="outside">Outside</button>
  `,
})
class HostComponent {
  open = false;
  picked: ContentItemType | null = null;
  dismissed = 0;
}

function makeHidden(): ComponentFixture<ContentTypePickerComponent> {
  TestBed.configureTestingModule({ imports: [ContentTypePickerComponent] });
  const fixture = TestBed.createComponent(ContentTypePickerComponent);
  fixture.detectChanges();
  return fixture;
}

function makeHosted(open = true): ComponentFixture<HostComponent> {
  TestBed.configureTestingModule({ imports: [HostComponent] });
  const fixture = TestBed.createComponent(HostComponent);
  fixture.componentInstance.open = open;
  fixture.detectChanges();
  return fixture;
}

describe('ContentTypePickerComponent', () => {
  it('renders nothing when open is false', () => {
    const fixture = makeHidden();
    expect(fixture.nativeElement.querySelector('.picker')).toBeNull();
  });

  it('renders three menu items with their labels when open', () => {
    const fixture = makeHosted(true);
    const items = fixture.nativeElement.querySelectorAll(
      '.picker-item',
    ) as NodeListOf<HTMLButtonElement>;
    expect(items).toHaveLength(3);
    const texts = Array.from(items).map(
      (i) => i.querySelector('.picker-label')?.textContent?.trim(),
    );
    expect(texts).toEqual(['Idea', 'Concept', 'Production Brief']);
  });

  it('renders descriptions for each option', () => {
    const fixture = makeHosted(true);
    const descs = Array.from(
      fixture.nativeElement.querySelectorAll(
        '.picker-description',
      ) as NodeListOf<HTMLElement>,
    ).map((e) => e.textContent?.trim());
    expect(descs).toEqual([
      'A raw spark to develop later',
      'A defined angle with a hook',
      'Ready to produce now',
    ]);
  });

  it('renders correct icon stroke colors per option', () => {
    const fixture = makeHosted(true);
    const items = fixture.nativeElement.querySelectorAll(
      '.picker-item',
    ) as NodeListOf<HTMLButtonElement>;
    const colors = Array.from(items).map(
      (i) => i.querySelector('svg')?.getAttribute('stroke'),
    );
    expect(colors).toEqual(['#3b82f6', '#a855f7', '#f97316']);
  });

  it('emits selected with type when an option is clicked', () => {
    const fixture = makeHosted(true);
    const conceptBtn = fixture.nativeElement.querySelector(
      '[data-type="concept"]',
    ) as HTMLButtonElement;
    conceptBtn.click();
    expect(fixture.componentInstance.picked).toBe('concept');
  });

  it('emits dismissed on Escape when open', () => {
    const fixture = makeHosted(true);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(fixture.componentInstance.dismissed).toBeGreaterThan(0);
  });

  it('does not emit dismissed on Escape when closed', () => {
    const fixture = makeHosted(false);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(fixture.componentInstance.dismissed).toBe(0);
  });

  it('emits dismissed on outside click when open', () => {
    const fixture = makeHosted(true);
    const outside = fixture.nativeElement.querySelector(
      '.outside',
    ) as HTMLElement;
    outside.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(fixture.componentInstance.dismissed).toBeGreaterThan(0);
  });

  it('does not emit dismissed when clicking inside the picker', () => {
    const fixture = makeHosted(true);
    const item = fixture.nativeElement.querySelector(
      '.picker-item',
    ) as HTMLElement;
    item.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(fixture.componentInstance.dismissed).toBe(0);
  });

  it('does not emit dismissed on outside click when closed', () => {
    const fixture = makeHosted(false);
    const outside = fixture.nativeElement.querySelector(
      '.outside',
    ) as HTMLElement;
    outside.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(fixture.componentInstance.dismissed).toBe(0);
  });
});
