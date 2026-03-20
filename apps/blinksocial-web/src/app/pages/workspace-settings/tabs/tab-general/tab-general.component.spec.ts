import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TabGeneralComponent } from './tab-general.component';
import { WorkspaceSettingsStateService } from '../../workspace-settings-state.service';

describe('TabGeneralComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<TabGeneralComponent>>;
  let state: WorkspaceSettingsStateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabGeneralComponent],
      providers: [
        WorkspaceSettingsStateService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    state = TestBed.inject(WorkspaceSettingsStateService);
    state.generalSettings.set({
      workspaceName: 'Hive Collective',
      purpose: 'Test purpose',
      mission: 'Test mission',
      brandVoice: 'Warm and encouraging',
      audienceSegments: [
        { id: 'seg-1', description: 'Tech-savvy engineers', ageRange: '25-34' },
      ],
    });

    fixture = TestBed.createComponent(TabGeneralComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render card title "General Information"', () => {
    const title = fixture.nativeElement.querySelector('.card-title');
    expect(title?.textContent).toContain('General Information');
  });

  it('should render card description', () => {
    const desc = fixture.nativeElement.querySelector('.card-description');
    expect(desc?.textContent).toContain('Detailed identity and basic strategy');
  });

  it('should render icons in field labels', () => {
    const icons = fixture.nativeElement.querySelectorAll('.field-label .field-icon');
    expect(icons.length).toBe(5);
  });

  it('should render tooltip triggers in field labels', () => {
    const tooltips = fixture.nativeElement.querySelectorAll('.tooltip-trigger');
    expect(tooltips.length).toBe(5);
  });

  it('should render workspace name input', () => {
    const input = fixture.nativeElement.querySelector('#ws-name') as HTMLInputElement;
    expect(input.value).toBe('Hive Collective');
  });

  it('should render purpose textarea', () => {
    const textarea = fixture.nativeElement.querySelector('#ws-purpose') as HTMLTextAreaElement;
    expect(textarea.value).toBe('Test purpose');
  });

  it('should render mission textarea', () => {
    const textarea = fixture.nativeElement.querySelector('#ws-mission') as HTMLTextAreaElement;
    expect(textarea.value).toBe('Test mission');
  });

  it('should render brand voice textarea', () => {
    const textarea = fixture.nativeElement.querySelector('#ws-brand-voice') as HTMLTextAreaElement;
    expect(textarea.value).toBe('Warm and encouraging');
  });

  it('should update state on input change', () => {
    const input = fixture.nativeElement.querySelector('#ws-name') as HTMLInputElement;
    input.value = 'Updated Name';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(state.generalSettings()?.workspaceName).toBe('Updated Name');
  });

  it('should update mission on textarea change', () => {
    const textarea = fixture.nativeElement.querySelector('#ws-mission') as HTMLTextAreaElement;
    textarea.value = 'New mission';
    textarea.dispatchEvent(new Event('input'));
    expect(state.generalSettings()?.mission).toBe('New mission');
  });

  it('should update brand voice on textarea change', () => {
    const textarea = fixture.nativeElement.querySelector('#ws-brand-voice') as HTMLTextAreaElement;
    textarea.value = 'Bold and direct';
    textarea.dispatchEvent(new Event('input'));
    expect(state.generalSettings()?.brandVoice).toBe('Bold and direct');
  });

  it('should not update when settings is null', () => {
    state.generalSettings.set(null);
    fixture.componentInstance.updateField('workspaceName', 'test');
    expect(state.generalSettings()).toBeNull();
  });

  it('should render existing audience segments', () => {
    const rows = fixture.nativeElement.querySelectorAll('.segment-row');
    expect(rows.length).toBe(1);
    const input = rows[0].querySelector('.field-input') as HTMLInputElement;
    expect(input.value).toBe('Tech-savvy engineers');
  });

  it('should add a new segment', () => {
    fixture.componentInstance.addSegment();
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('.segment-row');
    expect(rows.length).toBe(2);
  });

  it('should remove a segment', () => {
    fixture.componentInstance.removeSegment(0);
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('.segment-row');
    expect(rows.length).toBe(0);
  });

  it('should update segment description', () => {
    fixture.componentInstance.updateSegment(0, 'description', 'Updated description');
    expect(state.generalSettings()?.audienceSegments?.[0].description).toBe('Updated description');
  });

  it('should update segment age range', () => {
    fixture.componentInstance.updateSegment(0, 'ageRange', '35-44');
    expect(state.generalSettings()?.audienceSegments?.[0].ageRange).toBe('35-44');
  });

  it('should render add segment button', () => {
    const btn = fixture.nativeElement.querySelector('.add-segment-btn');
    expect(btn?.textContent).toContain('Add Segment');
  });

  it('should return empty segments when settings has none', () => {
    state.generalSettings.set({ workspaceName: 'Test' });
    expect(fixture.componentInstance.segments).toEqual([]);
  });

  it('should return empty brand voice when settings has none', () => {
    state.generalSettings.set({ workspaceName: 'Test' });
    expect(fixture.componentInstance.brandVoice).toBe('');
  });
});
