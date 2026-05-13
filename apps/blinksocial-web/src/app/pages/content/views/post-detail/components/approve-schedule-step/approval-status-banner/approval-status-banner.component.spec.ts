import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ApprovalStatusBannerComponent } from './approval-status-banner.component';

// Unique path-data fragments from `ICONS` for the icons this banner uses.
// We assert against rendered SVG <path d="…"> attributes because Angular
// signal/setter inputs don't project as DOM attributes.
const CHECK_CIRCLE_PATH = 'M22 11.08V12a10 10 0 1 1-5.93-9.14';
const ALERT_TRIANGLE_PATH = 'm21.73 18-8-14';

function setup(
  inputs: { canApprove: boolean; hasChanges: boolean; pendingCount: number },
): ComponentFixture<ApprovalStatusBannerComponent> {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [ApprovalStatusBannerComponent],
  });
  const fixture = TestBed.createComponent(ApprovalStatusBannerComponent);
  fixture.componentRef.setInput('canApprove', inputs.canApprove);
  fixture.componentRef.setInput('hasChanges', inputs.hasChanges);
  fixture.componentRef.setInput('pendingCount', inputs.pendingCount);
  fixture.detectChanges();
  return fixture;
}

describe('ApprovalStatusBannerComponent', () => {
  it('renders Approved state when canApprove is true', () => {
    const fixture = setup({ canApprove: true, hasChanges: false, pendingCount: 0 });
    const banner = fixture.nativeElement.querySelector('.banner');
    expect(banner?.getAttribute('data-state')).toBe('approved');
    expect(banner?.textContent).toContain('Approved');
    expect(banner?.querySelector('.banner-secondary')).toBeNull();
  });

  it('renders Changes Requested state when hasChanges is true', () => {
    const fixture = setup({ canApprove: false, hasChanges: true, pendingCount: 1 });
    const banner = fixture.nativeElement.querySelector('.banner');
    expect(banner?.getAttribute('data-state')).toBe('changes-requested');
    expect(banner?.textContent).toContain('Changes Requested');
    expect(banner?.querySelector('.banner-secondary')).toBeNull();
  });

  it('renders Pending Review with secondary copy when pendingCount > 0', () => {
    const fixture = setup({ canApprove: false, hasChanges: false, pendingCount: 1 });
    const banner = fixture.nativeElement.querySelector('.banner');
    expect(banner?.getAttribute('data-state')).toBe('pending');
    expect(banner?.textContent).toContain('Pending Review');
    expect(banner?.textContent).toContain('· 1 required approval pending');
  });

  it('pluralizes the secondary copy when pendingCount > 1', () => {
    const fixture = setup({ canApprove: false, hasChanges: false, pendingCount: 2 });
    const banner = fixture.nativeElement.querySelector('.banner');
    expect(banner?.textContent).toContain('· 2 required approvals pending');
  });

  it('omits secondary copy when pendingCount is 0 in Pending state', () => {
    const fixture = setup({ canApprove: false, hasChanges: false, pendingCount: 0 });
    const banner = fixture.nativeElement.querySelector('.banner');
    expect(banner?.querySelector('.banner-secondary')).toBeNull();
  });

  it('uses role="status" + aria-live="polite" for screen reader announcements', () => {
    const fixture = setup({ canApprove: true, hasChanges: false, pendingCount: 0 });
    const banner = fixture.nativeElement.querySelector('.banner');
    expect(banner?.getAttribute('role')).toBe('status');
    expect(banner?.getAttribute('aria-live')).toBe('polite');
  });

  it('uses check-circle icon in Approved state, alert-triangle otherwise', () => {
    const approved = setup({ canApprove: true, hasChanges: false, pendingCount: 0 });
    const approvedSvg = approved.nativeElement.querySelector('app-icon svg');
    expect(approvedSvg?.innerHTML).toContain(CHECK_CIRCLE_PATH);
    expect(approvedSvg?.innerHTML).not.toContain(ALERT_TRIANGLE_PATH);

    const pending = setup({ canApprove: false, hasChanges: false, pendingCount: 1 });
    const pendingSvg = pending.nativeElement.querySelector('app-icon svg');
    expect(pendingSvg?.innerHTML).toContain(ALERT_TRIANGLE_PATH);
    expect(pendingSvg?.innerHTML).not.toContain(CHECK_CIRCLE_PATH);
  });
});
