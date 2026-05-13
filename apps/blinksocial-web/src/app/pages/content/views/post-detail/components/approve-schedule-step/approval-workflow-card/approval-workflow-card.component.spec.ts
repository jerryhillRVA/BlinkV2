import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { ApprovalEntryContract } from '@blinksocial/contracts';
import {
  ApprovalStatusChange,
  ApprovalWorkflowCardComponent,
} from './approval-workflow-card.component';

const BR: ApprovalEntryContract = {
  role: 'brand-reviewer',
  label: 'Brand Reviewer',
  required: true,
  status: 'pending',
};

interface SetupInputs {
  approvals?: ReadonlyArray<ApprovalEntryContract>;
  canApprove?: boolean;
  hasChanges?: boolean;
  pendingCount?: number;
}

function setup(
  inputs: SetupInputs = {},
): ComponentFixture<ApprovalWorkflowCardComponent> {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [ApprovalWorkflowCardComponent],
  });
  const fixture = TestBed.createComponent(ApprovalWorkflowCardComponent);
  fixture.componentRef.setInput('approvals', inputs.approvals ?? [BR]);
  fixture.componentRef.setInput('canApprove', inputs.canApprove ?? false);
  fixture.componentRef.setInput('hasChanges', inputs.hasChanges ?? false);
  fixture.componentRef.setInput('pendingCount', inputs.pendingCount ?? 1);
  fixture.detectChanges();
  return fixture;
}

function clickButton(
  fixture: ComponentFixture<ApprovalWorkflowCardComponent>,
  text: string,
): void {
  const btn = Array.from(
    fixture.nativeElement.querySelectorAll('button'),
  ).find((b) => (b as HTMLButtonElement).textContent?.trim().includes(text)) as
    | HTMLButtonElement
    | undefined;
  expect(btn).toBeDefined();
  btn?.click();
}

describe('ApprovalWorkflowCardComponent', () => {
  it('renders one approver row per entry with required badge and pending status pill', () => {
    const fixture = setup({ approvals: [BR] });
    const rows = fixture.nativeElement.querySelectorAll('.approver-row');
    expect(rows.length).toBe(1);
    const row = rows[0] as HTMLElement;
    expect(row.getAttribute('data-status')).toBe('pending');
    expect(row.textContent).toContain('Brand Reviewer');
    expect(row.textContent).toContain('req');
    expect(row.querySelector('.status-pill--pending')).not.toBeNull();
  });

  it('renders an Approve button for pending rows and emits status="approved" when clicked', () => {
    const fixture = setup();
    const emitted: ApprovalStatusChange[] = [];
    fixture.componentInstance.statusChange.subscribe((e) => emitted.push(e));
    clickButton(fixture, 'Approve');
    expect(emitted).toEqual([{ role: 'brand-reviewer', status: 'approved' }]);
  });

  it('opens an inline note input on first Request Changes click; does NOT emit yet', () => {
    const fixture = setup();
    const emitted: ApprovalStatusChange[] = [];
    fixture.componentInstance.statusChange.subscribe((e) => emitted.push(e));
    clickButton(fixture, 'Request Changes');
    fixture.detectChanges();
    expect(emitted).toEqual([]);
    expect(fixture.nativeElement.querySelector('.note-input')).not.toBeNull();
  });

  it('shows the empty-note error when Submit is clicked without typing', () => {
    const fixture = setup();
    const emitted: ApprovalStatusChange[] = [];
    fixture.componentInstance.statusChange.subscribe((e) => emitted.push(e));
    // First click → open textarea
    clickButton(fixture, 'Request Changes');
    fixture.detectChanges();
    // Second click → button now reads "Submit"; click it with empty note
    clickButton(fixture, 'Submit');
    fixture.detectChanges();
    expect(emitted).toEqual([]);
    expect(fixture.nativeElement.querySelector('.note-error')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.note-error')?.textContent).toContain(
      'Add a note describing the required changes',
    );
  });

  it('emits status="changes-requested" with the note on Submit when note is filled', () => {
    const fixture = setup();
    const emitted: ApprovalStatusChange[] = [];
    fixture.componentInstance.statusChange.subscribe((e) => emitted.push(e));
    clickButton(fixture, 'Request Changes');
    fixture.detectChanges();
    const ta = fixture.nativeElement.querySelector('.note-input') as HTMLTextAreaElement;
    ta.value = 'Tighten the hook copy';
    ta.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    clickButton(fixture, 'Submit');
    fixture.detectChanges();
    expect(emitted).toEqual([
      {
        role: 'brand-reviewer',
        status: 'changes-requested',
        note: 'Tighten the hook copy',
      },
    ]);
    // Note input should close.
    expect(fixture.nativeElement.querySelector('.note-input')).toBeNull();
  });

  it('clears the empty-note error as soon as the user starts typing', () => {
    const fixture = setup();
    clickButton(fixture, 'Request Changes');
    fixture.detectChanges();
    clickButton(fixture, 'Submit');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.note-error')).not.toBeNull();
    const ta = fixture.nativeElement.querySelector('.note-input') as HTMLTextAreaElement;
    ta.value = 'x';
    ta.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.note-error')).toBeNull();
  });

  it('renders Revoke (not Approve) on already-approved rows; emits status="pending" on click', () => {
    const fixture = setup({
      approvals: [{ ...BR, status: 'approved' }],
      canApprove: true,
      pendingCount: 0,
    });
    const emitted: ApprovalStatusChange[] = [];
    fixture.componentInstance.statusChange.subscribe((e) => emitted.push(e));
    expect(fixture.nativeElement.querySelector('.status-pill--approved')).not.toBeNull();
    clickButton(fixture, 'Revoke');
    expect(emitted).toEqual([{ role: 'brand-reviewer', status: 'pending' }]);
  });

  it('renders the note italic-amber under a row when approval has a note', () => {
    const fixture = setup({
      approvals: [
        {
          ...BR,
          status: 'changes-requested',
          note: 'Tighten the hook copy',
        },
      ],
      hasChanges: true,
      pendingCount: 1,
    });
    const note = fixture.nativeElement.querySelector('.approver-note') as HTMLElement;
    expect(note).not.toBeNull();
    expect(note.textContent).toContain('Tighten the hook copy');
  });

  it('disables Approve & Publish when canApprove is false and shows the disabled-helper copy', () => {
    const fixture = setup({ canApprove: false, pendingCount: 1 });
    const cta = fixture.nativeElement.querySelector(
      '.approve-publish',
    ) as HTMLButtonElement;
    expect(cta.disabled).toBe(true);
    expect(cta.getAttribute('aria-disabled')).toBe('true');
    expect(fixture.nativeElement.querySelector('.approve-publish-helper')?.textContent).toContain(
      '1 required approval pending',
    );
  });

  it('renders the changes-requested helper copy when hasChanges is true', () => {
    const fixture = setup({ canApprove: false, hasChanges: true, pendingCount: 0 });
    expect(fixture.nativeElement.querySelector('.approve-publish-helper')?.textContent).toContain(
      'Resolve change requests before approving',
    );
  });

  it('pluralizes the disabled-helper copy when pendingCount > 1', () => {
    const fixture = setup({ canApprove: false, pendingCount: 2 });
    expect(fixture.nativeElement.querySelector('.approve-publish-helper')?.textContent).toContain(
      '2 required approvals pending',
    );
  });

  it('enables Approve & Publish when canApprove is true and emits approveAndPublish on click', () => {
    const fixture = setup({
      approvals: [{ ...BR, status: 'approved' }],
      canApprove: true,
      pendingCount: 0,
    });
    let emittedCount = 0;
    fixture.componentInstance.approveAndPublish.subscribe(() => emittedCount++);
    const cta = fixture.nativeElement.querySelector(
      '.approve-publish',
    ) as HTMLButtonElement;
    expect(cta.disabled).toBe(false);
    cta.click();
    expect(emittedCount).toBe(1);
  });

  it('ignores Approve & Publish clicks when not ready (guarded handler)', () => {
    const fixture = setup({ canApprove: false });
    let emittedCount = 0;
    fixture.componentInstance.approveAndPublish.subscribe(() => emittedCount++);
    // Bypass [disabled] by calling the handler directly via dispatchEvent on
    // the button — disabled prevents native click, but we want to prove the
    // guard works regardless.
    const cta = fixture.nativeElement.querySelector(
      '.approve-publish',
    ) as HTMLButtonElement;
    cta.dispatchEvent(new Event('click', { bubbles: true }));
    expect(emittedCount).toBe(0);
  });

  it('cancelNote closes the textarea without emitting status change', () => {
    const fixture = setup();
    const emitted: ApprovalStatusChange[] = [];
    fixture.componentInstance.statusChange.subscribe((e) => emitted.push(e));
    clickButton(fixture, 'Request Changes');
    fixture.detectChanges();
    clickButton(fixture, 'Cancel');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.note-input')).toBeNull();
    expect(emitted).toEqual([]);
  });

  it('adds aria-label to status pills for screen-reader context', () => {
    const fixture = setup({
      approvals: [{ ...BR, status: 'approved' }],
      canApprove: true,
      pendingCount: 0,
    });
    const pill = fixture.nativeElement.querySelector('.status-pill--approved');
    expect(pill?.getAttribute('aria-label')).toBe('Approved by Brand Reviewer');
  });

  it('wraps each approver row in role="group" with aria-labelledby pointing to the label', () => {
    const fixture = setup({ approvals: [BR] });
    const row = fixture.nativeElement.querySelector('.approver-row') as HTMLElement;
    expect(row.getAttribute('role')).toBe('group');
    expect(row.getAttribute('aria-labelledby')).toBe('approver-brand-reviewer-label');
    expect(fixture.nativeElement.querySelector('#approver-brand-reviewer-label')).not.toBeNull();
  });
});
