import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TabCalendarComponent } from './tab-calendar.component';
import { WorkspaceSettingsStateService } from '../../workspace-settings-state.service';
import type { CalendarSettingsContract } from '@blinksocial/contracts';

function makeMockSettings(): CalendarSettingsContract {
  return {
    enableDeadlineTemplates: true,
    deadlineTemplates: {
      VIDEO_SHORT_VERTICAL: {
        milestones: [
          { milestoneType: 'draft_due', offsetDays: -7, required: true },
          { milestoneType: 'assets_due', offsetDays: -5, required: true },
          { milestoneType: 'qa_due', offsetDays: -2, required: true },
        ],
        phases: [
          { phaseType: 'production_window', startOffsetDays: -7, endOffsetDays: -3, required: true },
          { phaseType: 'review_window', startOffsetDays: -2, endOffsetDays: -1, required: true },
        ],
      },
    },
    enableReminders: true,
    reminderSettings: {
      milestone72h: true,
      milestone24h: true,
      milestoneOverdue: true,
      publish24h: true,
    },
    autoCreateOnPublish: true,
  };
}

describe('TabCalendarComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<TabCalendarComponent>>;
  let state: WorkspaceSettingsStateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabCalendarComponent],
      providers: [
        WorkspaceSettingsStateService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    state = TestBed.inject(WorkspaceSettingsStateService);
    state.calendarSettings.set(makeMockSettings());

    fixture = TestBed.createComponent(TabCalendarComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render two tab-card sections', () => {
    const cards = fixture.nativeElement.querySelectorAll('.tab-card');
    expect(cards.length).toBe(2);
  });

  it('should render "Deadline Templates" card title', () => {
    const title = fixture.nativeElement.querySelector('.deadline-card .card-title');
    expect(title?.textContent).toContain('Deadline Templates');
  });

  it('should render card description for deadlines', () => {
    const desc = fixture.nativeElement.querySelector('.deadline-card .card-description');
    expect(desc?.textContent).toContain('milestone offsets');
  });

  it('should render CalendarDays icon in deadline header', () => {
    const icon = fixture.nativeElement.querySelector('.deadline-card .card-header-icon');
    expect(icon).toBeTruthy();
  });

  it('should render Enable Deadline Templates toggle', () => {
    const el = fixture.nativeElement;
    expect(el.textContent).toContain('Enable Deadline Templates');
    const toggle = el.querySelector('.toggle-enable-deadlines');
    expect(toggle).toBeTruthy();
  });

  it('should render Auto-create on Publish toggle', () => {
    const el = fixture.nativeElement;
    expect(el.textContent).toContain('Auto-create on Publish');
    const toggle = el.querySelector('.toggle-auto-create');
    expect(toggle).toBeTruthy();
  });

  it('should render content type selector', () => {
    const select = fixture.nativeElement.querySelector('.content-type-select');
    expect(select).toBeTruthy();
  });

  it('should render milestone rows', () => {
    const rows = fixture.nativeElement.querySelectorAll('.milestone-row');
    expect(rows.length).toBe(3);
  });

  it('should render phase rows', () => {
    const rows = fixture.nativeElement.querySelectorAll('.phase-row');
    expect(rows.length).toBe(2);
  });

  it('should render Milestones section label', () => {
    expect(fixture.nativeElement.textContent).toContain('Milestones');
  });

  it('should render Phase Windows section label', () => {
    expect(fixture.nativeElement.textContent).toContain('Phase Windows');
  });

  it('should render Add button for milestones', () => {
    const btn = fixture.nativeElement.querySelector('.add-milestone-btn');
    expect(btn).toBeTruthy();
  });

  it('should render Add button for phases', () => {
    const btn = fixture.nativeElement.querySelector('.add-phase-btn');
    expect(btn).toBeTruthy();
  });

  it('should render remove buttons for milestones', () => {
    const btns = fixture.nativeElement.querySelectorAll('.remove-milestone-btn');
    expect(btns.length).toBe(3);
  });

  it('should render remove buttons for phases', () => {
    const btns = fixture.nativeElement.querySelectorAll('.remove-phase-btn');
    expect(btns.length).toBe(2);
  });

  it('should render preview box', () => {
    const preview = fixture.nativeElement.querySelector('.preview-box');
    expect(preview).toBeTruthy();
  });

  it('should render Reminder Defaults card title', () => {
    const title = fixture.nativeElement.querySelector('.reminder-card .card-title');
    expect(title?.textContent).toContain('Reminder Defaults');
  });

  it('should render Enable Reminders toggle', () => {
    const toggle = fixture.nativeElement.querySelector('.toggle-enable-reminders');
    expect(toggle).toBeTruthy();
  });

  it('should render milestone reminder toggles', () => {
    const toggles = fixture.nativeElement.querySelectorAll('.milestone-reminder-toggle');
    expect(toggles.length).toBe(3);
  });

  it('should render publish reminder toggle', () => {
    const toggle = fixture.nativeElement.querySelector('.publish-reminder-toggle');
    expect(toggle).toBeTruthy();
  });

  it('should display content type display name', () => {
    const name = fixture.componentInstance.contentTypeDisplayName('VIDEO_SHORT_VERTICAL');
    expect(name).toContain('Short Vertical Video');
  });

  it('should display milestone type name', () => {
    const name = fixture.componentInstance.milestoneDisplayName('draft_due');
    expect(name).toBe('Draft Due');
  });

  it('should display phase type name', () => {
    const name = fixture.componentInstance.phaseDisplayName('production_window');
    expect(name).toBe('Production Window');
  });
});

describe('TabCalendarComponent interactions', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<TabCalendarComponent>>;
  let state: WorkspaceSettingsStateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabCalendarComponent],
      providers: [
        WorkspaceSettingsStateService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    state = TestBed.inject(WorkspaceSettingsStateService);
    state.calendarSettings.set(makeMockSettings());

    fixture = TestBed.createComponent(TabCalendarComponent);
    fixture.detectChanges();
  });

  it('should toggle enable deadlines', () => {
    fixture.componentInstance.toggleEnableDeadlines();
    fixture.detectChanges();
    expect(state.calendarSettings()?.enableDeadlineTemplates).toBe(false);
  });

  it('should toggle auto-create on publish', () => {
    fixture.componentInstance.toggleAutoCreate();
    fixture.detectChanges();
    expect(state.calendarSettings()?.autoCreateOnPublish).toBe(false);
  });

  it('should toggle enable reminders', () => {
    fixture.componentInstance.toggleEnableReminders();
    fixture.detectChanges();
    expect(state.calendarSettings()?.enableReminders).toBe(false);
  });

  it('should toggle reminder setting', () => {
    fixture.componentInstance.toggleReminder('milestone72h');
    fixture.detectChanges();
    expect(state.calendarSettings()?.reminderSettings.milestone72h).toBe(false);
  });

  it('should add milestone', () => {
    fixture.componentInstance.addMilestone();
    fixture.detectChanges();
    const template = state.calendarSettings()?.deadlineTemplates['VIDEO_SHORT_VERTICAL'];
    expect(template?.milestones.length).toBe(4);
  });

  it('should remove milestone', () => {
    fixture.componentInstance.removeMilestone(0);
    fixture.detectChanges();
    const template = state.calendarSettings()?.deadlineTemplates['VIDEO_SHORT_VERTICAL'];
    expect(template?.milestones.length).toBe(2);
  });

  it('should add phase', () => {
    fixture.componentInstance.addPhase();
    fixture.detectChanges();
    const template = state.calendarSettings()?.deadlineTemplates['VIDEO_SHORT_VERTICAL'];
    expect(template?.phases.length).toBe(3);
  });

  it('should remove phase', () => {
    fixture.componentInstance.removePhase(0);
    fixture.detectChanges();
    const template = state.calendarSettings()?.deadlineTemplates['VIDEO_SHORT_VERTICAL'];
    expect(template?.phases.length).toBe(1);
  });

  it('should toggle milestone required', () => {
    fixture.componentInstance.toggleMilestoneRequired(0);
    fixture.detectChanges();
    const template = state.calendarSettings()?.deadlineTemplates['VIDEO_SHORT_VERTICAL'];
    expect(template?.milestones[0].required).toBe(false);
  });

  it('should toggle phase required', () => {
    fixture.componentInstance.togglePhaseRequired(0);
    fixture.detectChanges();
    const template = state.calendarSettings()?.deadlineTemplates['VIDEO_SHORT_VERTICAL'];
    expect(template?.phases[0].required).toBe(false);
  });

  it('should update milestone offset', () => {
    fixture.componentInstance.updateMilestoneOffset(0, -10);
    fixture.detectChanges();
    const template = state.calendarSettings()?.deadlineTemplates['VIDEO_SHORT_VERTICAL'];
    expect(template?.milestones[0].offsetDays).toBe(-10);
  });

  it('should update phase start offset', () => {
    fixture.componentInstance.updatePhaseStart(0, -14);
    fixture.detectChanges();
    const template = state.calendarSettings()?.deadlineTemplates['VIDEO_SHORT_VERTICAL'];
    expect(template?.phases[0].startOffsetDays).toBe(-14);
  });

  it('should update phase end offset', () => {
    fixture.componentInstance.updatePhaseEnd(0, -5);
    fixture.detectChanges();
    const template = state.calendarSettings()?.deadlineTemplates['VIDEO_SHORT_VERTICAL'];
    expect(template?.phases[0].endOffsetDays).toBe(-5);
  });

  it('should toggle via DOM clicks', () => {
    const toggle = fixture.nativeElement.querySelector('.toggle-enable-deadlines') as HTMLButtonElement;
    toggle.click();
    fixture.detectChanges();
    expect(state.calendarSettings()?.enableDeadlineTemplates).toBe(false);
  });

  it('should add milestone via DOM click', () => {
    const btn = fixture.nativeElement.querySelector('.add-milestone-btn') as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('.milestone-row');
    expect(rows.length).toBe(4);
  });

  it('should remove milestone via DOM click', () => {
    const btn = fixture.nativeElement.querySelector('.remove-milestone-btn') as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('.milestone-row');
    expect(rows.length).toBe(2);
  });

  it('should add phase via DOM click', () => {
    const btn = fixture.nativeElement.querySelector('.add-phase-btn') as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('.phase-row');
    expect(rows.length).toBe(3);
  });

  it('should remove phase via DOM click', () => {
    const btn = fixture.nativeElement.querySelector('.remove-phase-btn') as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('.phase-row');
    expect(rows.length).toBe(1);
  });

  it('should toggle auto-create via DOM click', () => {
    const toggle = fixture.nativeElement.querySelector('.toggle-auto-create') as HTMLButtonElement;
    toggle.click();
    fixture.detectChanges();
    expect(state.calendarSettings()?.autoCreateOnPublish).toBe(false);
  });

  it('should toggle enable reminders via DOM click', () => {
    const toggle = fixture.nativeElement.querySelector('.toggle-enable-reminders') as HTMLButtonElement;
    toggle.click();
    fixture.detectChanges();
    expect(state.calendarSettings()?.enableReminders).toBe(false);
  });

  it('should toggle milestone reminder via DOM click', () => {
    const toggles = fixture.nativeElement.querySelectorAll('.milestone-reminder-toggle .toggle-switch');
    (toggles[0] as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(state.calendarSettings()?.reminderSettings.milestone72h).toBe(false);
  });

  it('should toggle 24h milestone reminder via DOM click', () => {
    const toggles = fixture.nativeElement.querySelectorAll('.milestone-reminder-toggle .toggle-switch');
    (toggles[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(state.calendarSettings()?.reminderSettings.milestone24h).toBe(false);
  });

  it('should toggle overdue milestone reminder via DOM click', () => {
    const toggles = fixture.nativeElement.querySelectorAll('.milestone-reminder-toggle .toggle-switch');
    (toggles[2] as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(state.calendarSettings()?.reminderSettings.milestoneOverdue).toBe(false);
  });

  it('should toggle publish reminder via DOM click', () => {
    const toggle = fixture.nativeElement.querySelector('.publish-reminder-toggle .toggle-switch') as HTMLButtonElement;
    toggle.click();
    fixture.detectChanges();
    expect(state.calendarSettings()?.reminderSettings.publish24h).toBe(false);
  });

  it('should toggle milestone required via DOM click', () => {
    const toggles = fixture.nativeElement.querySelectorAll('.milestone-row .toggle-switch');
    (toggles[0] as HTMLButtonElement).click();
    fixture.detectChanges();
    const template = state.calendarSettings()?.deadlineTemplates['VIDEO_SHORT_VERTICAL'];
    expect(template?.milestones[0].required).toBe(false);
  });

  it('should toggle phase required via DOM click', () => {
    const toggles = fixture.nativeElement.querySelectorAll('.phase-row .toggle-switch');
    (toggles[0] as HTMLButtonElement).click();
    fixture.detectChanges();
    const template = state.calendarSettings()?.deadlineTemplates['VIDEO_SHORT_VERTICAL'];
    expect(template?.phases[0].required).toBe(false);
  });

  it('should change content type via DOM select', () => {
    const select = fixture.nativeElement.querySelector('.content-type-select') as HTMLSelectElement;
    select.value = 'VIDEO_SHORT_VERTICAL';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(fixture.componentInstance.activeContentType).toBe('VIDEO_SHORT_VERTICAL');
  });

  it('should update milestone offset via DOM input change', () => {
    const inputs = fixture.nativeElement.querySelectorAll('.milestone-row .item-input');
    const input = inputs[0] as HTMLInputElement;
    input.value = '-10';
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    const template = state.calendarSettings()?.deadlineTemplates['VIDEO_SHORT_VERTICAL'];
    expect(template?.milestones[0].offsetDays).toBe(-10);
  });

  it('should update phase start via DOM input change', () => {
    const inputs = fixture.nativeElement.querySelectorAll('.phase-row .item-input');
    const input = inputs[0] as HTMLInputElement;
    input.value = '-14';
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    const template = state.calendarSettings()?.deadlineTemplates['VIDEO_SHORT_VERTICAL'];
    expect(template?.phases[0].startOffsetDays).toBe(-14);
  });

  it('should update phase end via DOM input change', () => {
    const inputs = fixture.nativeElement.querySelectorAll('.phase-row .item-input-sm');
    const input = inputs[1] as HTMLInputElement;
    input.value = '-5';
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    const template = state.calendarSettings()?.deadlineTemplates['VIDEO_SHORT_VERTICAL'];
    expect(template?.phases[0].endOffsetDays).toBe(-5);
  });

  it('should render preview dates', () => {
    const dates = fixture.nativeElement.querySelectorAll('.preview-item-date');
    expect(dates.length).toBeGreaterThan(0);
    expect(dates[0].textContent).toBeTruthy();
  });

  it('should render preview badges for required items', () => {
    const badges = fixture.nativeElement.querySelectorAll('.preview-badge');
    expect(badges.length).toBeGreaterThan(0);
    expect(badges[0].textContent).toContain('Required');
  });

  it('should render publish preview item', () => {
    const publish = fixture.nativeElement.querySelector('.preview-publish');
    expect(publish).toBeTruthy();
    expect(publish.textContent).toContain('Publish');
    expect(publish.textContent).toContain('Apr 30');
  });

  it('should select content type and reflect in activeContentType', () => {
    fixture.componentInstance.selectContentType('VIDEO_SHORT_VERTICAL');
    fixture.detectChanges();
    expect(fixture.componentInstance.activeContentType).toBe('VIDEO_SHORT_VERTICAL');
  });

  it('should return key for unknown content type', () => {
    expect(fixture.componentInstance.contentTypeDisplayName('UNKNOWN')).toBe('UNKNOWN');
  });

  it('should return key for unknown milestone type', () => {
    expect(fixture.componentInstance.milestoneDisplayName('unknown')).toBe('unknown');
  });

  it('should return key for unknown phase type', () => {
    expect(fixture.componentInstance.phaseDisplayName('unknown')).toBe('unknown');
  });

  it('should compute preview date correctly', () => {
    const date = fixture.componentInstance.previewDate(-7);
    expect(date).toContain('Apr');
  });
});

describe('TabCalendarComponent (null settings)', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<TabCalendarComponent>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabCalendarComponent],
      providers: [
        WorkspaceSettingsStateService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TabCalendarComponent);
    fixture.detectChanges();
  });

  it('should render nothing when settings is null', () => {
    const el = fixture.nativeElement;
    expect(el.querySelector('.tab-card')).toBeNull();
    expect(el.textContent.trim()).toBe('');
  });
});

describe('TabCalendarComponent (null guard)', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<TabCalendarComponent>>;
  let state: WorkspaceSettingsStateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabCalendarComponent],
      providers: [
        WorkspaceSettingsStateService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    state = TestBed.inject(WorkspaceSettingsStateService);
    fixture = TestBed.createComponent(TabCalendarComponent);
    fixture.detectChanges();
  });

  it('should not throw on toggle when null', () => {
    fixture.componentInstance.toggleEnableDeadlines();
    expect(state.calendarSettings()).toBeNull();
  });

  it('should not throw on addMilestone when null', () => {
    fixture.componentInstance.addMilestone();
    expect(state.calendarSettings()).toBeNull();
  });

  it('should not throw on addPhase when null', () => {
    fixture.componentInstance.addPhase();
    expect(state.calendarSettings()).toBeNull();
  });

  it('should not throw on toggleAutoCreate when null', () => {
    fixture.componentInstance.toggleAutoCreate();
    expect(state.calendarSettings()).toBeNull();
  });

  it('should not throw on toggleEnableReminders when null', () => {
    fixture.componentInstance.toggleEnableReminders();
    expect(state.calendarSettings()).toBeNull();
  });

  it('should not throw on toggleReminder when null', () => {
    fixture.componentInstance.toggleReminder('milestone72h');
    expect(state.calendarSettings()).toBeNull();
  });

  it('should not throw on removeMilestone when null', () => {
    fixture.componentInstance.removeMilestone(0);
    expect(state.calendarSettings()).toBeNull();
  });

  it('should not throw on removePhase when null', () => {
    fixture.componentInstance.removePhase(0);
    expect(state.calendarSettings()).toBeNull();
  });

  it('should not throw on updateMilestoneOffset when null', () => {
    fixture.componentInstance.updateMilestoneOffset(0, -10);
    expect(state.calendarSettings()).toBeNull();
  });

  it('should not throw on toggleMilestoneRequired when null', () => {
    fixture.componentInstance.toggleMilestoneRequired(0);
    expect(state.calendarSettings()).toBeNull();
  });

  it('should not throw on updatePhaseStart when null', () => {
    fixture.componentInstance.updatePhaseStart(0, -14);
    expect(state.calendarSettings()).toBeNull();
  });

  it('should not throw on updatePhaseEnd when null', () => {
    fixture.componentInstance.updatePhaseEnd(0, -5);
    expect(state.calendarSettings()).toBeNull();
  });

  it('should not throw on togglePhaseRequired when null', () => {
    fixture.componentInstance.togglePhaseRequired(0);
    expect(state.calendarSettings()).toBeNull();
  });

  it('should return empty milestones when null', () => {
    expect(fixture.componentInstance.milestones).toEqual([]);
  });

  it('should return empty phases when null', () => {
    expect(fixture.componentInstance.phases).toEqual([]);
  });

  it('should return empty content types when null', () => {
    expect(fixture.componentInstance.contentTypes).toEqual([]);
  });
});

describe('TabCalendarComponent (enableDeadlineTemplates undefined)', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<TabCalendarComponent>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabCalendarComponent],
      providers: [
        WorkspaceSettingsStateService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    const state = TestBed.inject(WorkspaceSettingsStateService);
    state.calendarSettings.set({
      deadlineTemplates: {},
      reminderSettings: { milestone72h: false, milestone24h: false, milestoneOverdue: false, publish24h: false },
      autoCreateOnPublish: false,
    });

    fixture = TestBed.createComponent(TabCalendarComponent);
    fixture.detectChanges();
  });

  it('should default enableDeadlineTemplates to true when undefined', () => {
    expect(fixture.componentInstance.isDeadlinesEnabled).toBe(true);
  });

  it('should default enableReminders to true when undefined', () => {
    expect(fixture.componentInstance.isRemindersEnabled).toBe(true);
  });

  it('should render no milestone rows when templates are empty', () => {
    const rows = fixture.nativeElement.querySelectorAll('.milestone-row');
    expect(rows.length).toBe(0);
  });

  it('should render no phase rows when templates are empty', () => {
    const rows = fixture.nativeElement.querySelectorAll('.phase-row');
    expect(rows.length).toBe(0);
  });
});

describe('TabCalendarComponent (selectedContentType)', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<TabCalendarComponent>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabCalendarComponent],
      providers: [
        WorkspaceSettingsStateService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    const state = TestBed.inject(WorkspaceSettingsStateService);
    state.calendarSettings.set(makeMockSettings());

    fixture = TestBed.createComponent(TabCalendarComponent);
    fixture.detectChanges();
  });

  it('should fall back to first content type when selectedContentType is invalid', () => {
    fixture.componentInstance.selectedContentType = 'NONEXISTENT';
    expect(fixture.componentInstance.activeContentType).toBe('VIDEO_SHORT_VERTICAL');
  });

  it('should use selectedContentType when valid', () => {
    fixture.componentInstance.selectedContentType = 'VIDEO_SHORT_VERTICAL';
    expect(fixture.componentInstance.activeContentType).toBe('VIDEO_SHORT_VERTICAL');
  });
});
