import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TabTeamComponent } from './tab-team.component';
import { WorkspaceSettingsStateService } from '../../workspace-settings-state.service';

function makeMockSettings() {
  return {
    members: [
      { id: 'u1', name: 'Brett Lewis', email: 'blewis@jackreiley.com', role: 'Admin' as const, status: 'active' as const, joinedAt: '2026-01-15T10:00:00Z' },
      { id: 'u2', name: 'Brett Lewis', email: 'vthokiebrett@gmail.com', role: 'Viewer' as const, status: 'active' as const, joinedAt: '2026-02-01T10:00:00Z' },
    ],
  };
}

describe('TabTeamComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<TabTeamComponent>>;
  let state: WorkspaceSettingsStateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabTeamComponent],
      providers: [
        WorkspaceSettingsStateService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    state = TestBed.inject(WorkspaceSettingsStateService);
    state.teamSettings.set(makeMockSettings());

    fixture = TestBed.createComponent(TabTeamComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render card with tab-card class', () => {
    const card = fixture.nativeElement.querySelector('.tab-card');
    expect(card).toBeTruthy();
  });

  it('should render card header with Users icon', () => {
    const icon = fixture.nativeElement.querySelector('.card-header-icon');
    expect(icon).toBeTruthy();
  });

  it('should render "Workspace Users" title', () => {
    const title = fixture.nativeElement.querySelector('.card-title');
    expect(title?.textContent).toContain('Workspace Users');
  });

  it('should render Add User button with UserPlus icon', () => {
    const btn = fixture.nativeElement.querySelector('.add-user-btn');
    expect(btn).toBeTruthy();
    expect(btn.textContent).toContain('Add User');
    const svg = btn.querySelector('svg');
    expect(svg).toBeTruthy();
    const text = btn.querySelector('.add-user-btn-text');
    expect(text).toBeTruthy();
  });

  it('should render member rows', () => {
    const rows = fixture.nativeElement.querySelectorAll('.member-row');
    expect(rows.length).toBe(2);
  });

  it('should show avatar initial', () => {
    const avatars = fixture.nativeElement.querySelectorAll('.member-avatar');
    expect(avatars[0].textContent.trim()).toBe('B');
    expect(avatars[1].textContent.trim()).toBe('B');
  });

  it('should display member name with role in parens', () => {
    const names = fixture.nativeElement.querySelectorAll('.member-name');
    expect(names[0].textContent).toContain('Brett Lewis');
    expect(names[0].textContent).toContain('(Admin)');
  });

  it('should display member email', () => {
    const emails = fixture.nativeElement.querySelectorAll('.member-email');
    expect(emails[0].textContent).toContain('blewis@jackreiley.com');
    expect(emails[1].textContent).toContain('vthokiebrett@gmail.com');
  });

  it('should highlight admin row', () => {
    const rows = fixture.nativeElement.querySelectorAll('.member-row');
    expect(rows[0].classList.contains('admin')).toBe(true);
    expect(rows[1].classList.contains('admin')).toBe(false);
  });
});

describe('TabTeamComponent interactions', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<TabTeamComponent>>;
  let state: WorkspaceSettingsStateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabTeamComponent],
      providers: [
        WorkspaceSettingsStateService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    state = TestBed.inject(WorkspaceSettingsStateService);
    state.teamSettings.set(makeMockSettings());

    fixture = TestBed.createComponent(TabTeamComponent);
    fixture.detectChanges();
  });

  it('should add a new member on Add User click', () => {
    fixture.componentInstance.addUser();
    fixture.detectChanges();
    expect(state.teamSettings()?.members.length).toBe(3);
    const rows = fixture.nativeElement.querySelectorAll('.member-row');
    expect(rows.length).toBe(3);
  });

  it('should add user via DOM click', () => {
    const btn = fixture.nativeElement.querySelector('.add-user-btn') as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();
    expect(state.teamSettings()?.members.length).toBe(3);
  });

  it('should display role label correctly for Viewer', () => {
    const names = fixture.nativeElement.querySelectorAll('.member-name');
    expect(names[1].textContent).toContain('(User)');
  });
});

describe('TabTeamComponent (null settings)', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<TabTeamComponent>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabTeamComponent],
      providers: [
        WorkspaceSettingsStateService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TabTeamComponent);
    fixture.detectChanges();
  });

  it('should render nothing when settings is null', () => {
    const el = fixture.nativeElement;
    expect(el.querySelector('.tab-card')).toBeNull();
    expect(el.textContent.trim()).toBe('');
  });
});

describe('TabTeamComponent (null guard)', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<TabTeamComponent>>;
  let state: WorkspaceSettingsStateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabTeamComponent],
      providers: [
        WorkspaceSettingsStateService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    state = TestBed.inject(WorkspaceSettingsStateService);
    fixture = TestBed.createComponent(TabTeamComponent);
    fixture.detectChanges();
  });

  it('should not add user when settings is null', () => {
    fixture.componentInstance.addUser();
    expect(state.teamSettings()).toBeNull();
  });

  it('should return empty members when settings is null', () => {
    expect(fixture.componentInstance.members).toEqual([]);
  });
});

describe('TabTeamComponent (empty members)', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<TabTeamComponent>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabTeamComponent],
      providers: [
        WorkspaceSettingsStateService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    const state = TestBed.inject(WorkspaceSettingsStateService);
    state.teamSettings.set({ members: [] });

    fixture = TestBed.createComponent(TabTeamComponent);
    fixture.detectChanges();
  });

  it('should render card with no member rows', () => {
    expect(fixture.nativeElement.querySelector('.tab-card')).toBeTruthy();
    const rows = fixture.nativeElement.querySelectorAll('.member-row');
    expect(rows.length).toBe(0);
  });

  it('should still render Add User button', () => {
    const btn = fixture.nativeElement.querySelector('.add-user-btn');
    expect(btn).toBeTruthy();
  });
});
