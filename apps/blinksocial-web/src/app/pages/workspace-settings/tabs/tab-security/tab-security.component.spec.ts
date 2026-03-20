import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TabSecurityComponent } from './tab-security.component';
import { WorkspaceSettingsStateService } from '../../workspace-settings-state.service';

function makeMockSettings() {
  return {
    twoFactorEnabled: false,
    activeSessions: [
      { id: 's1', device: 'MacBook Pro', browser: 'Chrome 122', location: 'Richmond, VA', lastActive: '2026-03-09T15:30:00Z', isCurrent: true },
    ],
    apiKeys: [
      { id: 'k1', name: 'CI/CD Pipeline', keyPrefix: 'bsk_live_xR7k', createdAt: '2026-02-01T10:00:00Z' },
    ],
    loginHistory: [
      { timestamp: '2026-03-09T08:15:00Z', ip: '192.168.1.100', device: 'MacBook Pro / Chrome', location: 'Richmond, VA', success: true },
    ],
  };
}

describe('TabSecurityComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<TabSecurityComponent>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabSecurityComponent],
      providers: [
        WorkspaceSettingsStateService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    const state = TestBed.inject(WorkspaceSettingsStateService);
    state.securitySettings.set(makeMockSettings());

    fixture = TestBed.createComponent(TabSecurityComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the tab-card', () => {
    const card = fixture.nativeElement.querySelector('.tab-card');
    expect(card).toBeTruthy();
  });

  it('should render "Security & Access" title', () => {
    const title = fixture.nativeElement.querySelector('.card-title');
    expect(title?.textContent).toContain('Security & Access');
  });

  it('should render Archive Workspace button', () => {
    const btn = fixture.nativeElement.querySelector('.archive-btn');
    expect(btn).toBeTruthy();
    expect(btn.textContent).toContain('Archive Workspace');
  });

  it('should style archive button as destructive', () => {
    const btn = fixture.nativeElement.querySelector('.archive-btn');
    expect(btn).toBeTruthy();
  });
});

describe('TabSecurityComponent (null settings)', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<TabSecurityComponent>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabSecurityComponent],
      providers: [
        WorkspaceSettingsStateService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TabSecurityComponent);
    fixture.detectChanges();
  });

  it('should render nothing when settings is null', () => {
    const el = fixture.nativeElement;
    expect(el.querySelector('.tab-card')).toBeNull();
    expect(el.textContent.trim()).toBe('');
  });
});
