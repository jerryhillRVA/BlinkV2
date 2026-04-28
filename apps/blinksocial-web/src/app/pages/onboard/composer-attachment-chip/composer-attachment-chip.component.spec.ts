import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { ComposerAttachmentChipComponent } from './composer-attachment-chip.component';

describe('ComposerAttachmentChipComponent', () => {
  it('renders filename and human-readable size', async () => {
    @Component({
      imports: [ComposerAttachmentChipComponent],
      template: `<app-composer-attachment-chip filename="brief.pdf" [sizeBytes]="1572864" />`,
    })
    class Host {}

    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const chip = fixture.nativeElement.querySelector('.chip');
    expect(chip.textContent).toContain('brief.pdf');
    expect(chip.textContent).toContain('1.5 MB');
  });

  it('emits remove when × is clicked', async () => {
    @Component({
      imports: [ComposerAttachmentChipComponent],
      template: `<app-composer-attachment-chip
        filename="x.txt"
        [sizeBytes]="100"
        (remove)="onRemove()" />`,
    })
    class Host {
      removed = 0;
      onRemove() {
        this.removed += 1;
      }
    }

    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.chip-remove');
    expect(button).toBeTruthy();
    button.click();
    expect(fixture.componentInstance.removed).toBe(1);
  });

  it('hides the remove button when removable=false', async () => {
    @Component({
      imports: [ComposerAttachmentChipComponent],
      template: `<app-composer-attachment-chip filename="x.txt" [sizeBytes]="100" [removable]="false" />`,
    })
    class Host {}

    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.chip-remove')).toBeFalsy();
  });

  it('renders error styling and message when error is set', async () => {
    @Component({
      imports: [ComposerAttachmentChipComponent],
      template: `<app-composer-attachment-chip filename="big.pdf" [sizeBytes]="100" error="Too large" />`,
    })
    class Host {}

    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const chip = fixture.nativeElement.querySelector('.chip');
    expect(chip.classList.contains('chip--error')).toBe(true);
    expect(chip.textContent).toContain('Too large');
  });
});
