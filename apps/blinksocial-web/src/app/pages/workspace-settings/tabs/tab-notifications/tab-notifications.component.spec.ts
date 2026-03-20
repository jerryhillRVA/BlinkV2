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
      channels: { email: true, inApp: true, slack: false, slackWebhookUrl: null },
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

  it('should render channel toggles', () => {
    const sections = fixture.nativeElement.querySelectorAll('.tab-section');
    expect(sections.length).toBe(2);
  });

  it('should show channel labels', () => {
    expect(fixture.nativeElement.textContent).toContain('Email');
    expect(fixture.nativeElement.textContent).toContain('In-App');
    expect(fixture.nativeElement.textContent).toContain('Slack');
  });

  it('should show trigger labels', () => {
    expect(fixture.nativeElement.textContent).toContain('Research Results');
    expect(fixture.nativeElement.textContent).toContain('Content Published');
  });

  it('should toggle channel on click', () => {
    const toggles = fixture.nativeElement.querySelectorAll('.toggle-switch');
    // Slack is off (3rd toggle in first section)
    toggles[2].click();
    fixture.detectChanges();
    expect(state.notificationSettings()?.channels.slack).toBe(true);
  });

  it('should toggle trigger on click', () => {
    const toggles = fixture.nativeElement.querySelectorAll('.toggle-switch');
    // qaReviewRequired is off (7th toggle overall, index 6)
    toggles[6].click();
    fixture.detectChanges();
    expect(state.notificationSettings()?.triggers.qaReviewRequired).toBe(true);
  });

  it('should not toggle channel when settings is null', () => {
    state.notificationSettings.set(null);
    fixture.componentInstance.toggleChannel('email');
    expect(state.notificationSettings()).toBeNull();
  });

  it('should not toggle trigger when settings is null', () => {
    state.notificationSettings.set(null);
    fixture.componentInstance.toggleTrigger('researchResults');
    expect(state.notificationSettings()).toBeNull();
  });

  it('should toggle all channel types', () => {
    const toggles = fixture.nativeElement.querySelectorAll('.toggle-switch');
    // Toggle email off
    toggles[0].click();
    expect(state.notificationSettings()?.channels.email).toBe(false);
    // Toggle inApp off
    toggles[1].click();
    expect(state.notificationSettings()?.channels.inApp).toBe(false);
  });

  it('should toggle remaining triggers', () => {
    const toggles = fixture.nativeElement.querySelectorAll('.toggle-switch');
    // Toggle weeklyDigest on (index 8)
    toggles[8].click();
    expect(state.notificationSettings()?.triggers.weeklyDigest).toBe(true);
    // Toggle approachingDeadlines off (index 7)
    toggles[7].click();
    expect(state.notificationSettings()?.triggers.approachingDeadlines).toBe(false);
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
    const el = fixture.nativeElement;
    expect(el.querySelector('.tab-section')).toBeNull();
    expect(el.querySelector('.toggle-switch')).toBeNull();
    expect(el.textContent.trim()).toBe('');
  });
});
