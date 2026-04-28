import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TabPlatformsComponent } from './tab-platforms.component';
import { WorkspaceSettingsStateService } from '../../workspace-settings-state.service';
import { Platform } from '@blinksocial/contracts';

function makeMockSettings() {
  return {
    globalRules: {
      defaultPlatform: Platform.YouTube,
      maxIdeasPerMonth: 30,
    },
    platforms: [
      { platformId: Platform.YouTube, enabled: true, defaultResolution: '1080x1920', postingSchedule: 'Daily' },
      { platformId: Platform.LinkedIn, enabled: true },
      { platformId: Platform.Twitter, enabled: false },
      { platformId: Platform.Instagram, enabled: false },
    ],
  };
}

describe('TabPlatformsComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<TabPlatformsComponent>>;
  let state: WorkspaceSettingsStateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabPlatformsComponent],
      providers: [
        WorkspaceSettingsStateService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    state = TestBed.inject(WorkspaceSettingsStateService);
    state.platformSettings.set(makeMockSettings());

    fixture = TestBed.createComponent(TabPlatformsComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render Global Settings card title', () => {
    const title = fixture.nativeElement.querySelector('.card-title');
    expect(title?.textContent).toContain('Global Settings');
  });

  it('should render Platforms card title', () => {
    const titles = fixture.nativeElement.querySelectorAll('.card-title');
    expect(titles[1]?.textContent).toContain('Platforms');
  });

  it('should not render the default-platform dropdown (removed in #58)', () => {
    expect(fixture.nativeElement.querySelector('app-dropdown')).toBeNull();
    expect(fixture.nativeElement.querySelector('.dropdown-trigger')).toBeNull();
  });

  it('should not crash when settings include legacy defaultPlatform field', () => {
    // makeMockSettings includes defaultPlatform — proves forward-compat
    expect(fixture.componentInstance).toBeTruthy();
    expect(state.platformSettings()?.globalRules.defaultPlatform).toBe(Platform.YouTube);
  });

  it('should render max ideas input with correct value', () => {
    const input = fixture.nativeElement.querySelector('#max-ideas') as HTMLInputElement;
    expect(input.value).toBe('30');
  });

  it('should render tooltip on max ideas only', () => {
    const tooltips = fixture.nativeElement.querySelectorAll('app-tooltip');
    expect(tooltips.length).toBe(1);
  });

  it('should render all platform rows (all enum values except tbd)', () => {
    const rows = fixture.nativeElement.querySelectorAll('.platform-row');
    expect(rows.length).toBe(8);
  });

  it('should display all platform names', () => {
    const names = fixture.nativeElement.querySelectorAll('.platform-name');
    const textList = Array.from(names).map((n) => (n as HTMLElement).textContent?.trim());
    expect(textList).toContain('YouTube');
    expect(textList).toContain('LinkedIn');
    expect(textList).toContain('Twitter/X');
    expect(textList).toContain('Instagram');
    expect(textList).toContain('TikTok');
    expect(textList).toContain('Facebook');
    expect(textList).toContain('Slack');
    expect(textList).toContain('Discord');
  });

  it('should show Active badge for enabled platforms', () => {
    expect(fixture.componentInstance.isPlatformEnabled('youtube')).toBe(true);
    expect(fixture.componentInstance.isPlatformEnabled('linkedin')).toBe(true);
  });

  it('should show Disabled badge for disabled platforms', () => {
    expect(fixture.componentInstance.isPlatformEnabled('twitter')).toBe(false);
    expect(fixture.componentInstance.isPlatformEnabled('instagram')).toBe(false);
  });

  it('should show Disabled for platforms not in settings array', () => {
    expect(fixture.componentInstance.isPlatformEnabled('slack')).toBe(false);
    expect(fixture.componentInstance.isPlatformEnabled('discord')).toBe(false);
  });

  it('should render active badge with green styling', () => {
    const badge = fixture.nativeElement.querySelector('.platform-badge-active');
    expect(badge).toBeTruthy();
    expect(badge.textContent.trim()).toBe('Active');
  });

  it('should render toggle switches for all platforms', () => {
    const toggles = fixture.nativeElement.querySelectorAll('.platform-toggle');
    expect(toggles.length).toBe(8);
  });

  it('should have toggle on for enabled platforms', () => {
    const toggles = fixture.nativeElement.querySelectorAll('.platform-toggle');
    // Order matches platformOptions: instagram, tiktok, youtube, facebook, linkedin, twitter, slack, discord
    // instagram=disabled, tiktok=not in settings(disabled), youtube=enabled, facebook=not in settings(disabled), linkedin=enabled
    const youtubeIdx = fixture.componentInstance.platformOptions.indexOf(Platform.YouTube);
    expect(toggles[youtubeIdx].getAttribute('aria-checked')).toBe('true');
  });

  it('should render platform icons with active styling for enabled', () => {
    const icons = fixture.nativeElement.querySelectorAll('.platform-icon-active');
    expect(icons.length).toBe(2); // youtube and linkedin
  });

  it('should toggle existing platform on click', () => {
    fixture.componentInstance.togglePlatform('twitter');
    fixture.detectChanges();
    expect(state.platformSettings()?.platforms.find((p) => p.platformId === 'twitter')?.enabled).toBe(true);
  });

  it('should add new platform when toggling one not in settings', () => {
    fixture.componentInstance.togglePlatform('slack');
    fixture.detectChanges();
    const slack = state.platformSettings()?.platforms.find((p) => p.platformId === 'slack');
    expect(slack).toBeTruthy();
    expect(slack?.enabled).toBe(true);
  });

  it('should toggle platform via DOM click', () => {
    const toggles = fixture.nativeElement.querySelectorAll('.platform-toggle');
    const twitterIdx = fixture.componentInstance.platformOptions.indexOf(Platform.Twitter);
    (toggles[twitterIdx] as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(state.platformSettings()?.platforms.find((p) => p.platformId === 'twitter')?.enabled).toBe(true);
  });

  it('should update max ideas on input change', () => {
    const input = fixture.nativeElement.querySelector('#max-ideas') as HTMLInputElement;
    input.value = '50';
    input.dispatchEvent(new Event('input'));
    expect(state.platformSettings()?.globalRules.maxIdeasPerMonth).toBe(50);
  });

  it('should render Share2 icon in platform rows', () => {
    const svgs = fixture.nativeElement.querySelectorAll('.platform-icon svg');
    expect(svgs.length).toBe(8);
  });

  it('should display name for unknown platform id', () => {
    expect(fixture.componentInstance.displayName('unknown')).toBe('unknown');
  });
});

describe('TabPlatformsComponent (null settings)', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<TabPlatformsComponent>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabPlatformsComponent],
      providers: [
        WorkspaceSettingsStateService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TabPlatformsComponent);
    fixture.detectChanges();
  });

  it('should render nothing when settings is null', () => {
    const el = fixture.nativeElement;
    expect(el.querySelector('.tab-card')).toBeNull();
    expect(el.textContent.trim()).toBe('');
  });
});

describe('TabPlatformsComponent (null guard)', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<TabPlatformsComponent>>;
  let state: WorkspaceSettingsStateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabPlatformsComponent],
      providers: [
        WorkspaceSettingsStateService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    state = TestBed.inject(WorkspaceSettingsStateService);
    fixture = TestBed.createComponent(TabPlatformsComponent);
    fixture.detectChanges();
  });

  it('should not update max ideas when settings is null', () => {
    fixture.componentInstance.updateMaxIdeas('50');
    expect(state.platformSettings()).toBeNull();
  });

  it('should not toggle when settings is null', () => {
    fixture.componentInstance.togglePlatform('youtube');
    expect(state.platformSettings()).toBeNull();
  });

  it('should not update max ideas with NaN', () => {
    state.platformSettings.set({
      globalRules: { maxIdeasPerMonth: 30 },
      platforms: [],
    });
    fixture.componentInstance.updateMaxIdeas('abc');
    expect(state.platformSettings()?.globalRules.maxIdeasPerMonth).toBe(30);
  });

  it('should return false for isPlatformEnabled when settings is null', () => {
    expect(fixture.componentInstance.isPlatformEnabled('youtube')).toBe(false);
  });
});
