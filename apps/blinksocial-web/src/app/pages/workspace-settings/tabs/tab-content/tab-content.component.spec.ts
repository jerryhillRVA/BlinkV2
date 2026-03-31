import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TabContentComponent } from './tab-content.component';
import { WorkspaceSettingsStateService } from '../../workspace-settings-state.service';
import { Platform } from '@blinksocial/contracts';
import type { BrandVoiceSettingsContract } from '@blinksocial/contracts';

function makeMockSettings(): BrandVoiceSettingsContract {
  return {
    brandVoiceDescription: 'Test voice',
    audienceOptions: ['Engineers', 'Founders', 'Social Media Managers'],
    contentPillars: [
      {
        id: 'pillar-1',
        name: 'Industry News',
        description: 'Breaking tech news.',
        color: '#d94e33',
        themes: ['AI', 'Software Development'],
        audienceSegmentIds: ['Engineers'],
        targetPlatforms: [Platform.YouTube, Platform.LinkedIn],
      },
      {
        id: 'pillar-2',
        name: 'How-To Guides',
        description: 'Practical tutorials.',
        color: '#3b82f6',
        themes: ['Tutorials', 'Productivity'],
        audienceSegmentIds: ['Social Media Managers'],
        targetPlatforms: [Platform.YouTube],
      },
    ],
  };
}

describe('TabContentComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<TabContentComponent>>;
  let state: WorkspaceSettingsStateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabContentComponent],
      providers: [
        WorkspaceSettingsStateService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    state = TestBed.inject(WorkspaceSettingsStateService);
    state.brandVoiceSettings.set(makeMockSettings());

    fixture = TestBed.createComponent(TabContentComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render card title "Content Strategy"', () => {
    const title = fixture.nativeElement.querySelector('.card-title');
    expect(title?.textContent).toContain('Content Strategy');
  });

  it('should render card description', () => {
    const desc = fixture.nativeElement.querySelector('.card-description');
    expect(desc?.textContent).toContain('content pillars');
  });

  it('should render Add Pillar button', () => {
    const btn = fixture.nativeElement.querySelector('.add-pillar-btn');
    expect(btn).toBeTruthy();
    expect(btn.textContent).toContain('Add Pillar');
  });

  it('should render pillar cards', () => {
    const cards = fixture.nativeElement.querySelectorAll('.pillar-card');
    expect(cards.length).toBe(2);
  });

  it('should render pillar name inputs with correct values', () => {
    const inputs = fixture.nativeElement.querySelectorAll('.pillar-input');
    expect(inputs[0].value).toBe('Industry News');
    expect(inputs[2].value).toBe('How-To Guides');
  });

  it('should render themes as comma-separated string', () => {
    const inputs = fixture.nativeElement.querySelectorAll('.pillar-input');
    expect(inputs[1].value).toBe('AI, Software Development');
    expect(inputs[3].value).toBe('Tutorials, Productivity');
  });

  it('should render description textareas', () => {
    const textareas = fixture.nativeElement.querySelectorAll('.pillar-textarea');
    expect(textareas.length).toBe(2);
    expect(textareas[0].value).toBe('Breaking tech news.');
  });

  it('should render tooltip triggers', () => {
    const tooltips = fixture.nativeElement.querySelectorAll('.tooltip-trigger');
    expect(tooltips.length).toBeGreaterThan(0);
  });

  it('should render audience pills', () => {
    const pills = fixture.nativeElement.querySelectorAll('.pill');
    expect(pills.length).toBeGreaterThan(0);
  });

  it('should show active audience pills', () => {
    const activePills = fixture.nativeElement.querySelectorAll('.pill-audience-active');
    expect(activePills.length).toBe(2);
  });

  it('should show active platform pills', () => {
    const activePills = fixture.nativeElement.querySelectorAll('.pill-platform-active');
    expect(activePills.length).toBe(3);
  });

  it('should render check icons in active pills', () => {
    const checks = fixture.nativeElement.querySelectorAll('.pill-check');
    expect(checks.length).toBe(5);
  });

  it('should render pillar remove buttons', () => {
    const removeButtons = fixture.nativeElement.querySelectorAll('.pillar-remove-btn');
    expect(removeButtons.length).toBe(2);
  });

  it('should render mapping labels', () => {
    const labels = fixture.nativeElement.querySelectorAll('.mapping-label');
    expect(labels.length).toBe(4);
    expect(labels[0].textContent).toContain('Audience Mapping');
    expect(labels[1].textContent).toContain('Target Platforms');
  });

  it('should render platform display names', () => {
    const pills = fixture.nativeElement.querySelectorAll('.pill');
    const platformPillTexts = Array.from(pills).map((p) => (p as HTMLElement).textContent?.trim());
    expect(platformPillTexts).toContain('YouTube');
    expect(platformPillTexts).toContain('LinkedIn');
  });

  it('should display unknown platform id as-is', () => {
    expect(fixture.componentInstance.platformDisplayName('unknown')).toBe('unknown');
  });
});

describe('TabContentComponent interactions', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<TabContentComponent>>;
  let state: WorkspaceSettingsStateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabContentComponent],
      providers: [
        WorkspaceSettingsStateService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    state = TestBed.inject(WorkspaceSettingsStateService);
    state.brandVoiceSettings.set(makeMockSettings());

    fixture = TestBed.createComponent(TabContentComponent);
    fixture.detectChanges();
  });

  it('should add a new pillar on Add Pillar click', () => {
    fixture.componentInstance.addPillar();
    fixture.detectChanges();
    expect(state.brandVoiceSettings()?.contentPillars?.length).toBe(3);
    const cards = fixture.nativeElement.querySelectorAll('.pillar-card');
    expect(cards.length).toBe(3);
  });

  it('should remove pillar on remove click', () => {
    fixture.componentInstance.removePillar(0);
    fixture.detectChanges();
    expect(state.brandVoiceSettings()?.contentPillars?.length).toBe(1);
    expect(state.brandVoiceSettings()?.contentPillars?.[0].name).toBe('How-To Guides');
  });

  it('should update pillar name on input', () => {
    fixture.componentInstance.updatePillarField(0, 'name', 'Updated Name');
    expect(state.brandVoiceSettings()?.contentPillars?.[0].name).toBe('Updated Name');
  });

  it('should update pillar description on input', () => {
    fixture.componentInstance.updatePillarField(1, 'description', 'New desc');
    expect(state.brandVoiceSettings()?.contentPillars?.[1].description).toBe('New desc');
  });

  it('should update pillar themes from comma-separated input', () => {
    fixture.componentInstance.updatePillarThemes(0, 'React, Angular, Vue');
    const themes = state.brandVoiceSettings()?.contentPillars?.[0].themes;
    expect(themes).toEqual(['React', 'Angular', 'Vue']);
  });

  it('should handle empty themes input', () => {
    fixture.componentInstance.updatePillarThemes(0, '');
    const themes = state.brandVoiceSettings()?.contentPillars?.[0].themes;
    expect(themes).toEqual([]);
  });

  it('should toggle audience on (add)', () => {
    fixture.componentInstance.toggleAudience(0, 'Founders');
    fixture.detectChanges();
    const ids = state.brandVoiceSettings()?.contentPillars?.[0].audienceSegmentIds;
    expect(ids).toContain('Founders');
    expect(ids).toContain('Engineers');
  });

  it('should toggle audience off (remove)', () => {
    fixture.componentInstance.toggleAudience(0, 'Engineers');
    fixture.detectChanges();
    const ids = state.brandVoiceSettings()?.contentPillars?.[0].audienceSegmentIds;
    expect(ids).not.toContain('Engineers');
  });

  it('should toggle platform on (add)', () => {
    fixture.componentInstance.togglePlatform(0, Platform.Instagram);
    fixture.detectChanges();
    const platforms = state.brandVoiceSettings()?.contentPillars?.[0].targetPlatforms;
    expect(platforms).toContain(Platform.Instagram);
    expect(platforms).toContain(Platform.YouTube);
  });

  it('should toggle platform off (remove)', () => {
    fixture.componentInstance.togglePlatform(0, Platform.YouTube);
    fixture.detectChanges();
    const platforms = state.brandVoiceSettings()?.contentPillars?.[0].targetPlatforms;
    expect(platforms).not.toContain(Platform.YouTube);
    expect(platforms).toContain(Platform.LinkedIn);
  });

  it('should correctly report audience selection', () => {
    const pillars = state.brandVoiceSettings()?.contentPillars;
    const pillar = pillars?.[0];
    expect(pillar).toBeTruthy();
    expect(fixture.componentInstance.isAudienceSelected(pillar as NonNullable<typeof pillar>, 'Engineers')).toBe(true);
    expect(fixture.componentInstance.isAudienceSelected(pillar as NonNullable<typeof pillar>, 'Founders')).toBe(false);
  });

  it('should correctly report platform selection', () => {
    const pillars = state.brandVoiceSettings()?.contentPillars;
    const pillar = pillars?.[0];
    expect(pillar).toBeTruthy();
    expect(fixture.componentInstance.isPlatformSelected(pillar as NonNullable<typeof pillar>, Platform.YouTube)).toBe(true);
    expect(fixture.componentInstance.isPlatformSelected(pillar as NonNullable<typeof pillar>, Platform.Instagram)).toBe(false);
  });
});

describe('TabContentComponent (null settings)', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<TabContentComponent>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabContentComponent],
      providers: [
        WorkspaceSettingsStateService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TabContentComponent);
    fixture.detectChanges();
  });

  it('should render nothing when settings is null', () => {
    const el = fixture.nativeElement;
    expect(el.querySelector('.tab-card')).toBeNull();
    expect(el.textContent.trim()).toBe('');
  });
});

describe('TabContentComponent (null guard)', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<TabContentComponent>>;
  let state: WorkspaceSettingsStateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabContentComponent],
      providers: [
        WorkspaceSettingsStateService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    state = TestBed.inject(WorkspaceSettingsStateService);
    fixture = TestBed.createComponent(TabContentComponent);
    fixture.detectChanges();
  });

  it('should not add pillar when settings is null', () => {
    fixture.componentInstance.addPillar();
    expect(state.brandVoiceSettings()).toBeNull();
  });

  it('should not remove pillar when settings is null', () => {
    fixture.componentInstance.removePillar(0);
    expect(state.brandVoiceSettings()).toBeNull();
  });

  it('should not update pillar field when settings is null', () => {
    fixture.componentInstance.updatePillarField(0, 'name', 'test');
    expect(state.brandVoiceSettings()).toBeNull();
  });

  it('should not update themes when settings is null', () => {
    fixture.componentInstance.updatePillarThemes(0, 'test');
    expect(state.brandVoiceSettings()).toBeNull();
  });

  it('should not toggle audience when settings is null', () => {
    fixture.componentInstance.toggleAudience(0, 'Engineers');
    expect(state.brandVoiceSettings()).toBeNull();
  });

  it('should not toggle platform when settings is null', () => {
    fixture.componentInstance.togglePlatform(0, Platform.YouTube);
    expect(state.brandVoiceSettings()).toBeNull();
  });

  it('should return empty pillars when settings is null', () => {
    expect(fixture.componentInstance.pillars).toEqual([]);
  });

  it('should return empty audience options when settings is null', () => {
    expect(fixture.componentInstance.audienceOptions).toEqual([]);
  });
});

describe('TabContentComponent DOM interactions', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<TabContentComponent>>;
  let state: WorkspaceSettingsStateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabContentComponent],
      providers: [
        WorkspaceSettingsStateService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    state = TestBed.inject(WorkspaceSettingsStateService);
    state.brandVoiceSettings.set(makeMockSettings());

    fixture = TestBed.createComponent(TabContentComponent);
    fixture.detectChanges();
  });

  it('should add pillar via DOM click on Add Pillar button', () => {
    const btn = fixture.nativeElement.querySelector('.add-pillar-btn') as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();
    expect(state.brandVoiceSettings()?.contentPillars?.length).toBe(3);
  });

  it('should remove pillar via DOM click on remove button', () => {
    const btn = fixture.nativeElement.querySelector('.pillar-remove-btn') as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();
    expect(state.brandVoiceSettings()?.contentPillars?.length).toBe(1);
  });

  it('should update pillar name via DOM input event', () => {
    const input = fixture.nativeElement.querySelector('#pillar-name-0') as HTMLInputElement;
    input.value = 'New Name';
    input.dispatchEvent(new Event('input'));
    expect(state.brandVoiceSettings()?.contentPillars?.[0].name).toBe('New Name');
  });

  it('should update themes via DOM input event', () => {
    const input = fixture.nativeElement.querySelector('#pillar-themes-0') as HTMLInputElement;
    input.value = 'React, Vue';
    input.dispatchEvent(new Event('input'));
    expect(state.brandVoiceSettings()?.contentPillars?.[0].themes).toEqual(['React', 'Vue']);
  });

  it('should update description via DOM input event', () => {
    const textarea = fixture.nativeElement.querySelector('#pillar-desc-0') as HTMLTextAreaElement;
    textarea.value = 'Updated description';
    textarea.dispatchEvent(new Event('input'));
    expect(state.brandVoiceSettings()?.contentPillars?.[0].description).toBe('Updated description');
  });

  it('should toggle audience pill via DOM click', () => {
    const pills = fixture.nativeElement.querySelectorAll('.pill');
    // First pill group has audience pills: Engineers, Founders, Social Media Managers
    // Find the inactive "Founders" pill in the first pillar
    const foundersPill = Array.from(pills).find(
      (p) => (p as HTMLElement).textContent?.trim() === 'Founders' && !(p as HTMLElement).classList.contains('pill-audience-active')
    ) as HTMLButtonElement;
    foundersPill.click();
    fixture.detectChanges();
    expect(state.brandVoiceSettings()?.contentPillars?.[0].audienceSegmentIds).toContain('Founders');
  });

  it('should toggle platform pill via DOM click', () => {
    const pills = fixture.nativeElement.querySelectorAll('.pill-platform-active');
    // Click a currently active platform to deactivate it
    (pills[0] as HTMLButtonElement).click();
    fixture.detectChanges();
    const platforms = state.brandVoiceSettings()?.contentPillars?.[0].targetPlatforms;
    expect(platforms?.length).toBe(1);
  });
});

describe('TabContentComponent (undefined arrays in pillar)', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<TabContentComponent>>;
  let state: WorkspaceSettingsStateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabContentComponent],
      providers: [
        WorkspaceSettingsStateService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    state = TestBed.inject(WorkspaceSettingsStateService);
    state.brandVoiceSettings.set({
      brandVoiceDescription: 'Test',
      audienceOptions: ['Engineers'],
      contentPillars: [
        {
          id: 'pillar-x',
          name: 'Bare Pillar',
          description: 'No arrays',
          color: '#000',
        },
      ],
    });

    fixture = TestBed.createComponent(TabContentComponent);
    fixture.detectChanges();
  });

  it('should handle pillar with undefined themes', () => {
    const pillar = state.brandVoiceSettings()?.contentPillars?.[0];
    expect(pillar).toBeTruthy();
    expect(fixture.componentInstance.themesDisplay(pillar as NonNullable<typeof pillar>)).toBe('');
  });

  it('should handle pillar with undefined audienceSegmentIds', () => {
    const pillar = state.brandVoiceSettings()?.contentPillars?.[0];
    expect(pillar).toBeTruthy();
    expect(fixture.componentInstance.isAudienceSelected(pillar as NonNullable<typeof pillar>, 'Engineers')).toBe(false);
  });

  it('should handle pillar with undefined targetPlatforms', () => {
    const pillar = state.brandVoiceSettings()?.contentPillars?.[0];
    expect(pillar).toBeTruthy();
    expect(fixture.componentInstance.isPlatformSelected(pillar as NonNullable<typeof pillar>, 'youtube')).toBe(false);
  });

  it('should toggle audience on pillar with undefined audienceSegmentIds', () => {
    fixture.componentInstance.toggleAudience(0, 'Engineers');
    expect(state.brandVoiceSettings()?.contentPillars?.[0].audienceSegmentIds).toEqual(['Engineers']);
  });

  it('should toggle platform on pillar with undefined targetPlatforms', () => {
    fixture.componentInstance.togglePlatform(0, Platform.YouTube);
    expect(state.brandVoiceSettings()?.contentPillars?.[0].targetPlatforms).toEqual([Platform.YouTube]);
  });
});

describe('TabContentComponent (empty pillars)', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<TabContentComponent>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabContentComponent],
      providers: [
        WorkspaceSettingsStateService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    const state = TestBed.inject(WorkspaceSettingsStateService);
    state.brandVoiceSettings.set({
      brandVoiceDescription: 'Test',
      contentPillars: [],
      audienceOptions: [],
    });

    fixture = TestBed.createComponent(TabContentComponent);
    fixture.detectChanges();
  });

  it('should render card but no pillar cards', () => {
    expect(fixture.nativeElement.querySelector('.tab-card')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('.pillar-card').length).toBe(0);
  });

  it('should still render Add Pillar button', () => {
    expect(fixture.nativeElement.querySelector('.add-pillar-btn')).toBeTruthy();
  });
});

describe('TabContentComponent audienceDisplayName', () => {
  let component: TabContentComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabContentComponent],
      providers: [
        WorkspaceSettingsStateService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    const state = TestBed.inject(WorkspaceSettingsStateService);
    state.brandVoiceSettings.set({
      brandVoiceDescription: 'Test',
      contentPillars: [],
      audienceOptions: ['seg-1', 'seg-2'],
      audienceSegments: [
        { id: 'seg-1', name: 'The Overwhelmed Time-Pressed Professional Executive', description: 'A very long description' },
        { id: 'seg-2', name: 'The Beginner' },
      ],
    } as never);

    const fixture = TestBed.createComponent(TabContentComponent);
    fixture.detectChanges();
    component = fixture.componentInstance;
  });

  it('should use name field for display when available', () => {
    expect(component.audienceDisplayName('seg-2')).toBe('The Beginner');
  });

  it('should truncate long names with ellipsis', () => {
    const result = component.audienceDisplayName('seg-1');
    expect(result.endsWith('...')).toBe(true);
    expect(result.length).toBe(40);
  });

  it('should return raw id when segment is not found', () => {
    expect(component.audienceDisplayName('unknown-id')).toBe('unknown-id');
  });

  it('should fall back to description when name is missing', () => {
    const state = TestBed.inject(WorkspaceSettingsStateService);
    state.brandVoiceSettings.set({
      brandVoiceDescription: 'Test',
      contentPillars: [],
      audienceOptions: ['seg-x'],
      audienceSegments: [
        { id: 'seg-x', description: 'Short desc' },
      ],
    } as never);
    expect(component.audienceDisplayName('seg-x')).toBe('Short desc');
  });
});
