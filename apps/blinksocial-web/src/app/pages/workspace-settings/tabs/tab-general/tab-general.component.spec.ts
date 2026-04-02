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
    expect(icons.length).toBe(4);
  });

  it('should render tooltips in field labels', () => {
    const tooltips = fixture.nativeElement.querySelectorAll('app-tooltip');
    expect(tooltips.length).toBe(4);
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

  it('should return empty brand voice when settings has none', () => {
    state.generalSettings.set({ workspaceName: 'Test' });
    expect(fixture.componentInstance.brandVoice).toBe('');
  });

  it('should render purpose textarea with empty string when purpose is undefined', () => {
    state.generalSettings.set({ workspaceName: 'Test' });
    fixture.detectChanges();
    const textarea = fixture.nativeElement.querySelector('#ws-purpose') as HTMLTextAreaElement;
    expect(textarea.value).toBe('');
  });

  it('should render mission textarea with empty string when mission is undefined', () => {
    state.generalSettings.set({ workspaceName: 'Test' });
    fixture.detectChanges();
    const textarea = fixture.nativeElement.querySelector('#ws-mission') as HTMLTextAreaElement;
    expect(textarea.value).toBe('');
  });

  it('should not render when settings is null', () => {
    state.generalSettings.set(null);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.tab-card')).toBeFalsy();
  });
});
