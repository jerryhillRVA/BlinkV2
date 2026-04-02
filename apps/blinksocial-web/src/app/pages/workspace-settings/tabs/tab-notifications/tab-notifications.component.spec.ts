import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TabNotificationsComponent } from './tab-notifications.component';
import { WorkspaceSettingsStateService } from '../../workspace-settings-state.service';

describe('TabNotificationsComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<TabNotificationsComponent>>;
  let state: WorkspaceSettingsStateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabNotificationsComponent],
      providers: [
        WorkspaceSettingsStateService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    state = TestBed.inject(WorkspaceSettingsStateService);
    state.notificationSettings.set({
      channels: { email: true, inApp: true, slack: false },
      triggers: {
        researchResults: true,
        contentPublished: true,
        teamMentions: true,
        qaReviewRequired: false,
        approachingDeadlines: true,
        weeklyDigest: false,
      },
    });

    fixture = TestBed.createComponent(TabNotificationsComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render card title "Notification Settings"', () => {
    const title = fixture.nativeElement.querySelector('.card-title');
    expect(title?.textContent).toContain('Notification Settings');
  });

  it('should render 2 toggle rows', () => {
    const rows = fixture.nativeElement.querySelectorAll('.toggle-row');
    expect(rows.length).toBe(2);
  });

  it('should render Content Published and Critical Errors labels', () => {
    const labels = fixture.nativeElement.querySelectorAll('.toggle-label');
    expect(labels[0].textContent).toContain('Content Published');
    expect(labels[1].textContent).toContain('Critical Errors');
  });

  it('should toggle contentPublished trigger on click', () => {
    const switches = fixture.nativeElement.querySelectorAll('.toggle-switch');
    switches[0].click();
    expect(state.notificationSettings()?.triggers.contentPublished).toBe(false);
  });

  it('should toggle qaReviewRequired trigger on click', () => {
    const switches = fixture.nativeElement.querySelectorAll('.toggle-switch');
    switches[1].click();
    expect(state.notificationSettings()?.triggers.qaReviewRequired).toBe(true);
  });

  it('should not toggle when settings is null', () => {
    state.notificationSettings.set(null);
    fixture.componentInstance.toggleTrigger('contentPublished');
    expect(state.notificationSettings()).toBeNull();
  });

  it('should handle empty notification settings loaded via state service', () => {
    // Simulate what happens when AFS returns {} for notifications.json
    // The state service defaults missing channels/triggers
    state.notificationSettings.set({
      channels: { email: false, inApp: false, slack: false },
      triggers: {
        researchResults: false, contentPublished: false, teamMentions: false,
        qaReviewRequired: false, approachingDeadlines: false, weeklyDigest: false,
      },
    });
    fixture.detectChanges();
    fixture.componentInstance.toggleTrigger('contentPublished');
    expect(state.notificationSettings()?.triggers.contentPublished).toBe(true);
  });
});

describe('TabNotificationsComponent (null settings)', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<TabNotificationsComponent>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabNotificationsComponent],
      providers: [
        WorkspaceSettingsStateService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TabNotificationsComponent);
    fixture.detectChanges();
  });

  it('should render nothing when settings is null', () => {
    expect(fixture.nativeElement.querySelector('.tab-card')).toBeNull();
    expect(fixture.nativeElement.textContent.trim()).toBe('');
  });
});
