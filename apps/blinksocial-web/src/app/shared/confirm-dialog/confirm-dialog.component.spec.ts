import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmDialogComponent } from './confirm-dialog.component';

function setup(
  opts: {
    open?: boolean;
    title?: string;
    body?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    tone?: 'primary' | 'destructive';
  } = {},
): ComponentFixture<ConfirmDialogComponent> {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ imports: [ConfirmDialogComponent] });
  const fixture = TestBed.createComponent(ConfirmDialogComponent);
  fixture.componentRef.setInput('title', opts.title ?? 'Title');
  if (opts.open !== undefined) fixture.componentRef.setInput('open', opts.open);
  if (opts.body !== undefined) fixture.componentRef.setInput('body', opts.body);
  if (opts.confirmLabel !== undefined)
    fixture.componentRef.setInput('confirmLabel', opts.confirmLabel);
  if (opts.cancelLabel !== undefined)
    fixture.componentRef.setInput('cancelLabel', opts.cancelLabel);
  if (opts.tone !== undefined) fixture.componentRef.setInput('tone', opts.tone);
  fixture.detectChanges();
  return fixture;
}

describe('ConfirmDialogComponent', () => {
  it('renders nothing when open=false', () => {
    const fixture = setup({ open: false });
    expect(fixture.nativeElement.querySelector('.cd-backdrop')).toBeNull();
  });

  it('renders backdrop + dialog with role="dialog" and aria-modal when open=true', () => {
    const fixture = setup({ open: true, title: 'Export' });
    expect(fixture.nativeElement.querySelector('.cd-backdrop')).not.toBeNull();
    const dialog = fixture.nativeElement.querySelector('.cd-dialog') as HTMLElement;
    expect(dialog.getAttribute('role')).toBe('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(fixture.nativeElement.querySelector('#cd-title')?.textContent?.trim()).toBe('Export');
  });

  it('wires aria-describedby only when body is provided', () => {
    const fixtureA = setup({ open: true, body: 'Long body copy.' });
    expect(
      fixtureA.nativeElement.querySelector('.cd-dialog')?.getAttribute('aria-describedby'),
    ).toBe('cd-body');
    expect(fixtureA.nativeElement.querySelector('#cd-body')?.textContent?.trim()).toBe(
      'Long body copy.',
    );
    const fixtureB = setup({ open: true });
    expect(
      fixtureB.nativeElement.querySelector('.cd-dialog')?.getAttribute('aria-describedby'),
    ).toBeNull();
  });

  it('renders the confirm/cancel labels supplied by inputs', () => {
    const fixture = setup({
      open: true,
      confirmLabel: 'Download',
      cancelLabel: 'Not now',
    });
    const btns = Array.from(
      fixture.nativeElement.querySelectorAll('.cd-actions button') as NodeListOf<HTMLButtonElement>,
    );
    expect(btns[0].textContent?.trim()).toBe('Not now');
    expect(btns[1].textContent?.trim()).toBe('Download');
  });

  it('clicking confirm emits the confirm output', () => {
    const fixture = setup({ open: true });
    let count = 0;
    fixture.componentInstance.confirm.subscribe(() => count++);
    const btn = fixture.nativeElement.querySelector('.cd-btn--primary') as HTMLButtonElement;
    expect(btn).not.toBeNull();
    btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(count).toBe(1);
  });

  it('clicking cancel emits the cancel output', () => {
    const fixture = setup({ open: true });
    let count = 0;
    fixture.componentInstance.cancelled.subscribe(() => count++);
    const btn = fixture.nativeElement.querySelector('.cd-btn--secondary') as HTMLButtonElement;
    expect(btn).not.toBeNull();
    btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(count).toBe(1);
  });

  it('ESC emits cancel only when open', () => {
    const fixture = setup({ open: true });
    let count = 0;
    fixture.componentInstance.cancelled.subscribe(() => count++);
    // The HostListener binds to document; ensure that dispatch path lands
    // inside the component's event-handler scope.
    fixture.componentInstance['onEscape']();
    expect(count).toBe(1);

    const fixtureB = setup({ open: false });
    let countB = 0;
    fixtureB.componentInstance.cancelled.subscribe(() => countB++);
    fixtureB.componentInstance['onEscape']();
    expect(countB).toBe(0);
  });

  it('backdrop click emits cancel; clicks inside the dialog do not', () => {
    const fixture = setup({ open: true });
    let count = 0;
    fixture.componentInstance.cancelled.subscribe(() => count++);
    const backdrop = fixture.nativeElement.querySelector('.cd-backdrop') as HTMLElement;
    const dialog = fixture.nativeElement.querySelector('.cd-dialog') as HTMLElement;
    // Synthesize a click on the backdrop (target === currentTarget).
    const onBackdrop = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(onBackdrop, 'target', { value: backdrop });
    Object.defineProperty(onBackdrop, 'currentTarget', { value: backdrop });
    fixture.componentInstance['onBackdropClick'](onBackdrop);
    expect(count).toBe(1);
    // Synthesize a click whose target is the inner dialog (not the backdrop).
    const onDialog = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(onDialog, 'target', { value: dialog });
    Object.defineProperty(onDialog, 'currentTarget', { value: backdrop });
    fixture.componentInstance['onBackdropClick'](onDialog);
    expect(count).toBe(1);
  });

  it('renders the destructive tone class when tone=destructive', () => {
    const fixture = setup({ open: true, tone: 'destructive' });
    const btn = fixture.nativeElement.querySelector('.cd-btn--destructive');
    expect(btn).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.cd-btn--primary')).toBeNull();
  });

  it('renders the primary tone by default', () => {
    const fixture = setup({ open: true });
    expect(fixture.nativeElement.querySelector('.cd-btn--primary')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.cd-btn--destructive')).toBeNull();
  });
});
