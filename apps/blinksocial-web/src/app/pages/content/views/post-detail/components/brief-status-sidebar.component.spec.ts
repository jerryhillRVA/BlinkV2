import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BriefStatusSidebarComponent } from './brief-status-sidebar.component';
import type { BriefValidationIssue } from '../post-detail.types';

interface SetupOpts {
  approved?: boolean;
  approvedAt?: string;
  approvedBy?: string;
  done?: number;
  total?: number;
  errors?: BriefValidationIssue[];
  warnings?: BriefValidationIssue[];
  canApprove?: boolean;
}

function setup(
  opts: SetupOpts = {},
): ComponentFixture<BriefStatusSidebarComponent> {
  TestBed.configureTestingModule({ imports: [BriefStatusSidebarComponent] });
  const fixture = TestBed.createComponent(BriefStatusSidebarComponent);
  fixture.componentRef.setInput('approved', opts.approved ?? false);
  fixture.componentRef.setInput('approvedAt', opts.approvedAt);
  fixture.componentRef.setInput('approvedBy', opts.approvedBy);
  fixture.componentRef.setInput('requiredDone', opts.done ?? 0);
  fixture.componentRef.setInput('requiredTotal', opts.total ?? 8);
  fixture.componentRef.setInput('errors', opts.errors ?? []);
  fixture.componentRef.setInput('warnings', opts.warnings ?? []);
  fixture.componentRef.setInput('canApprove', opts.canApprove ?? false);
  fixture.detectChanges();
  return fixture;
}

describe('BriefStatusSidebarComponent', () => {
  it('shows "In Review" badge when not approved', () => {
    const fixture = setup({ approved: false });
    expect(
      (fixture.nativeElement.querySelector('.status-badge') as HTMLElement).textContent?.trim(),
    ).toBe('In Review');
  });

  it('shows "Approved" badge when approved', () => {
    const fixture = setup({ approved: true });
    expect(
      (fixture.nativeElement.querySelector('.status-badge') as HTMLElement).textContent?.trim(),
    ).toBe('Approved');
  });

  it('renders the progress bar width matching done/total', () => {
    const fixture = setup({ done: 4, total: 8 });
    const fill = fixture.nativeElement.querySelector(
      '.status-progress-fill',
    ) as HTMLElement;
    expect(fill.style.width).toBe('50%');
    expect(fill.classList.contains('is-complete')).toBe(false);
  });

  it('marks the bar complete at 100%', () => {
    const fixture = setup({ done: 8, total: 8 });
    const fill = fixture.nativeElement.querySelector(
      '.status-progress-fill',
    ) as HTMLElement;
    expect(fill.classList.contains('is-complete')).toBe(true);
  });

  it('omits approved block when not approved', () => {
    const fixture = setup({ approved: false });
    expect(fixture.nativeElement.querySelector('.status-approved')).toBeNull();
    expect(fixture.nativeElement.querySelector('.btn-unlock')).toBeNull();
  });

  it('renders approved block + "by {user}" + unlock button when approved', () => {
    const fixture = setup({
      approved: true,
      approvedAt: '2026-04-20T10:00:00Z',
      approvedBy: 'Alice',
    });
    const text = (
      fixture.nativeElement.querySelector('.status-approved') as HTMLElement
    ).textContent ?? '';
    expect(text).toContain('Approved');
    expect(text).toContain('Alice');
    expect(fixture.nativeElement.querySelector('.btn-unlock')).not.toBeNull();
  });

  it('hides the errors list when empty', () => {
    const fixture = setup();
    expect(fixture.nativeElement.querySelector('.is-errors')).toBeNull();
  });

  it('renders the errors list when populated', () => {
    const fixture = setup({
      errors: [{ field: 'title', label: 'Title is required' }],
    });
    const text = (
      fixture.nativeElement.querySelector('.is-errors') as HTMLElement
    ).textContent ?? '';
    expect(text).toContain('Title is required');
  });

  it('hides the warnings list when empty', () => {
    const fixture = setup();
    expect(fixture.nativeElement.querySelector('.is-warnings')).toBeNull();
  });

  it('renders the warnings list when populated', () => {
    const fixture = setup({
      warnings: [{ field: 'keyMessage', label: 'Near max length' }],
    });
    const text = (
      fixture.nativeElement.querySelector('.is-warnings') as HTMLElement
    ).textContent ?? '';
    expect(text).toContain('Near max length');
  });

  it('Continue is disabled when !canApprove and labelled "Approve & Continue" when unapproved', () => {
    const fixture = setup({ approved: false, canApprove: false });
    const btn = fixture.nativeElement.querySelector(
      '.btn-continue',
    ) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(btn.textContent?.trim()).toBe('Approve & Continue');
  });

  it('Continue is "Continue to Builder" when approved', () => {
    const fixture = setup({ approved: true, canApprove: true });
    const btn = fixture.nativeElement.querySelector(
      '.btn-continue',
    ) as HTMLButtonElement;
    expect(btn.textContent?.trim()).toBe('Continue to Builder');
    expect(btn.disabled).toBe(false);
  });

  it('clicking Continue when unapproved emits approve then continueToBuilder', () => {
    const fixture = setup({ approved: false, canApprove: true });
    const approves: number[] = [];
    const continues: number[] = [];
    fixture.componentInstance.approve.subscribe(() => approves.push(1));
    fixture.componentInstance.continueToBuilder.subscribe(() => continues.push(1));
    (
      fixture.nativeElement.querySelector('.btn-continue') as HTMLButtonElement
    ).click();
    expect(approves.length).toBe(1);
    expect(continues.length).toBe(1);
  });

  it('clicking Continue when approved emits only continueToBuilder', () => {
    const fixture = setup({ approved: true, canApprove: true });
    const approves: number[] = [];
    const continues: number[] = [];
    fixture.componentInstance.approve.subscribe(() => approves.push(1));
    fixture.componentInstance.continueToBuilder.subscribe(() => continues.push(1));
    (
      fixture.nativeElement.querySelector('.btn-continue') as HTMLButtonElement
    ).click();
    expect(approves.length).toBe(0);
    expect(continues.length).toBe(1);
  });

  it('toggling the Approve checkbox emits approve when checked, unlock when unchecked', () => {
    const fixture = setup({ approved: false, canApprove: true });
    const approves: number[] = [];
    const unlocks: number[] = [];
    fixture.componentInstance.approve.subscribe(() => approves.push(1));
    fixture.componentInstance.unlock.subscribe(() => unlocks.push(1));
    const checkbox = fixture.nativeElement.querySelector(
      '.approve-toggle input',
    ) as HTMLInputElement;
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change'));
    expect(approves.length).toBe(1);
    checkbox.checked = false;
    checkbox.dispatchEvent(new Event('change'));
    expect(unlocks.length).toBe(1);
  });

  it('unlock button on approved state emits unlock', () => {
    const fixture = setup({ approved: true, canApprove: true });
    const unlocks: number[] = [];
    fixture.componentInstance.unlock.subscribe(() => unlocks.push(1));
    (
      fixture.nativeElement.querySelector('.btn-unlock') as HTMLButtonElement
    ).click();
    expect(unlocks.length).toBe(1);
  });

  it('progressPercent safely returns 0 when total is 0', () => {
    const fixture = setup({ done: 0, total: 0 });
    const fill = fixture.nativeElement.querySelector(
      '.status-progress-fill',
    ) as HTMLElement;
    expect(fill.style.width).toBe('0%');
  });
});
