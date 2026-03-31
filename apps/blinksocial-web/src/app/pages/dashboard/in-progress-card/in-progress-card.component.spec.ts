import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Component } from '@angular/core';
import { InProgressCardComponent } from './in-progress-card.component';
import type { Workspace } from '../workspace-card/workspace-card.component';

@Component({
  imports: [InProgressCardComponent],
  template: `<app-in-progress-card [workspace]="workspace" />`,
})
class TestHostComponent {
  workspace: Workspace = { id: 'test-1', name: 'Test Workspace', color: '#d94e33', status: 'onboarding' };
}

describe('InProgressCardComponent', () => {
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    }).compileComponents();
    router = TestBed.inject(Router);
  });

  function createComponent(status = 'onboarding') {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.workspace = { id: 'ws-1', name: 'My Workspace', color: '#d94e33', status };
    fixture.detectChanges();
    return fixture;
  }

  it('should create', () => {
    const fixture = createComponent();
    expect(fixture.nativeElement.querySelector('.in-progress-card')).toBeTruthy();
  });

  it('should show workspace name', () => {
    const fixture = createComponent();
    const name = fixture.nativeElement.querySelector('.workspace-name');
    expect(name.textContent).toContain('My Workspace');
  });

  it('should show "Discovery in Progress" badge for onboarding status', () => {
    const fixture = createComponent('onboarding');
    const badge = fixture.nativeElement.querySelector('.status-badge');
    expect(badge.textContent).toContain('Discovery in Progress');
    expect(badge.classList.contains('badge-onboarding')).toBe(true);
  });

  it('should show "Setup in Progress" badge for creating status', () => {
    const fixture = createComponent('creating');
    const badge = fixture.nativeElement.querySelector('.status-badge');
    expect(badge.textContent).toContain('Setup in Progress');
    expect(badge.classList.contains('badge-creating')).toBe(true);
  });

  it('should have a resume button', () => {
    const fixture = createComponent();
    const btn = fixture.nativeElement.querySelector('.resume-btn');
    expect(btn).toBeTruthy();
    expect(btn.textContent).toContain('Resume');
  });

  it('should navigate to /onboard for onboarding workspace', () => {
    const fixture = createComponent('onboarding');
    const btn = fixture.nativeElement.querySelector('.resume-btn');
    btn.click();
    expect(router.navigate).toHaveBeenCalledWith(['/onboard'], { queryParams: { workspace: 'ws-1' } });
  });

  it('should navigate to /new-workspace for creating workspace', () => {
    const fixture = createComponent('creating');
    const btn = fixture.nativeElement.querySelector('.resume-btn');
    btn.click();
    expect(router.navigate).toHaveBeenCalledWith(['/new-workspace'], { queryParams: { resume: 'ws-1' } });
  });

  it('should have an accent bar with correct class', () => {
    const fixture = createComponent('onboarding');
    const bar = fixture.nativeElement.querySelector('.accent-bar');
    expect(bar.classList.contains('badge-onboarding')).toBe(true);
  });

  it('should navigate on card click', () => {
    const fixture = createComponent('onboarding');
    const card = fixture.nativeElement.querySelector('.in-progress-card');
    card.click();
    expect(router.navigate).toHaveBeenCalled();
  });
});
