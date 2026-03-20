import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TabAgentsComponent } from './tab-agents.component';
import { WorkspaceSettingsStateService } from '../../workspace-settings-state.service';
import type { SkillSettingsContract } from '@blinksocial/contracts';

function makeMockSettings(): SkillSettingsContract {
  return {
    skills: [
      {
        id: 'sk1', skillId: 'research', name: 'Reporting Agent', role: 'News Aggregator',
        persona: 'Focuses on scanning RSS feeds daily to identify emerging tech trends.',
        responsibilities: ['Daily scanning', 'Summarization'],
        enabled: true,
      },
      {
        id: 'sk2', skillId: 'creative', name: 'Creative Agent', role: 'Content Specialist',
        persona: 'Specializes in high-engagement social media content.',
        responsibilities: ['Hook generation', 'Caption writing'],
        enabled: true,
      },
    ],
  };
}

describe('TabAgentsComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<TabAgentsComponent>>;
  let state: WorkspaceSettingsStateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabAgentsComponent],
      providers: [
        WorkspaceSettingsStateService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
      ],
    }).compileComponents();

    state = TestBed.inject(WorkspaceSettingsStateService);
    state.skillSettings.set(makeMockSettings());

    fixture = TestBed.createComponent(TabAgentsComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render card title "Agent Personalities"', () => {
    const title = fixture.nativeElement.querySelector('.card-title');
    expect(title?.textContent).toContain('Agent Personalities');
  });

  it('should render card description', () => {
    const desc = fixture.nativeElement.querySelector('.card-description');
    expect(desc?.textContent).toContain('AI team members');
  });

  it('should render Add Agent button', () => {
    const btn = fixture.nativeElement.querySelector('.add-agent-btn');
    expect(btn).toBeTruthy();
    expect(btn.textContent).toContain('Add Agent');
  });

  it('should render agent rows', () => {
    const rows = fixture.nativeElement.querySelectorAll('.agent-row');
    expect(rows.length).toBe(2);
  });

  it('should render numbered circles', () => {
    const numbers = fixture.nativeElement.querySelectorAll('.agent-number');
    expect(numbers.length).toBe(2);
    expect(numbers[0].textContent.trim()).toBe('1');
    expect(numbers[1].textContent.trim()).toBe('2');
  });

  it('should display agent names', () => {
    const names = fixture.nativeElement.querySelectorAll('.agent-name');
    expect(names[0].textContent).toContain('Reporting Agent');
    expect(names[1].textContent).toContain('Creative Agent');
  });

  it('should display role badges', () => {
    const badges = fixture.nativeElement.querySelectorAll('.agent-role-badge');
    expect(badges.length).toBe(2);
    expect(badges[0].textContent.trim()).toBe('News Aggregator');
    expect(badges[1].textContent.trim()).toBe('Content Specialist');
  });

  it('should display first responsibility as preview text', () => {
    const personas = fixture.nativeElement.querySelectorAll('.agent-persona');
    expect(personas.length).toBe(2);
    expect(personas[0].textContent).toContain('Daily scanning');
  });

  it('should render edit buttons', () => {
    const editBtns = fixture.nativeElement.querySelectorAll('.action-btn-edit');
    expect(editBtns.length).toBe(2);
  });

  it('should render remove buttons', () => {
    const removeBtns = fixture.nativeElement.querySelectorAll('.action-btn-remove');
    expect(removeBtns.length).toBe(2);
  });

  it('should render chevron icons', () => {
    const chevrons = fixture.nativeElement.querySelectorAll('.agent-chevron');
    expect(chevrons.length).toBe(2);
  });
});

describe('TabAgentsComponent interactions', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<TabAgentsComponent>>;
  let state: WorkspaceSettingsStateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabAgentsComponent],
      providers: [
        WorkspaceSettingsStateService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
      ],
    }).compileComponents();

    state = TestBed.inject(WorkspaceSettingsStateService);
    state.skillSettings.set(makeMockSettings());

    fixture = TestBed.createComponent(TabAgentsComponent);
    fixture.detectChanges();
  });

  it('should add a new agent with default name "New Agent"', () => {
    fixture.componentInstance.addAgent();
    fixture.detectChanges();
    const skills = state.skillSettings()?.skills;
    expect(skills?.length).toBe(3);
    expect(skills?.[2].name).toBe('New Agent');
  });

  it('should auto-open edit panel for newly added agent', () => {
    fixture.componentInstance.addAgent();
    fixture.detectChanges();
    expect(fixture.componentInstance.editingIndex()).toBe(2);
    expect(fixture.nativeElement.querySelector('.agent-edit-panel')).toBeTruthy();
  });

  it('should add agent via DOM click', () => {
    const btn = fixture.nativeElement.querySelector('.add-agent-btn') as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();
    expect(state.skillSettings()?.skills.length).toBe(3);
    expect(state.skillSettings()?.skills[2].name).toBe('New Agent');
  });

  it('should remove agent on remove click', () => {
    fixture.componentInstance.removeAgent(0);
    fixture.detectChanges();
    expect(state.skillSettings()?.skills.length).toBe(1);
    expect(state.skillSettings()?.skills[0].name).toBe('Creative Agent');
  });

  it('should remove agent via DOM click', () => {
    const btn = fixture.nativeElement.querySelector('.action-btn-remove') as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();
    expect(state.skillSettings()?.skills.length).toBe(1);
  });

  it('should render correct number after adding agent', () => {
    fixture.componentInstance.addAgent();
    fixture.detectChanges();
    const numbers = fixture.nativeElement.querySelectorAll('.agent-number');
    expect(numbers[2].textContent.trim()).toBe('3');
  });
});

describe('TabAgentsComponent (null settings)', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<TabAgentsComponent>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabAgentsComponent],
      providers: [
        WorkspaceSettingsStateService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TabAgentsComponent);
    fixture.detectChanges();
  });

  it('should render nothing when settings is null', () => {
    const el = fixture.nativeElement;
    expect(el.querySelector('.tab-card')).toBeNull();
    expect(el.textContent.trim()).toBe('');
  });
});

describe('TabAgentsComponent (null guard)', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<TabAgentsComponent>>;
  let state: WorkspaceSettingsStateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabAgentsComponent],
      providers: [
        WorkspaceSettingsStateService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
      ],
    }).compileComponents();

    state = TestBed.inject(WorkspaceSettingsStateService);
    fixture = TestBed.createComponent(TabAgentsComponent);
    fixture.detectChanges();
  });

  it('should not add agent when settings is null', () => {
    fixture.componentInstance.addAgent();
    expect(state.skillSettings()).toBeNull();
  });

  it('should not remove agent when settings is null', () => {
    fixture.componentInstance.removeAgent(0);
    expect(state.skillSettings()).toBeNull();
  });

  it('should return empty agents when settings is null', () => {
    expect(fixture.componentInstance.agents).toEqual([]);
  });
});

describe('TabAgentsComponent edit panel', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<TabAgentsComponent>>;
  let state: WorkspaceSettingsStateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabAgentsComponent],
      providers: [
        WorkspaceSettingsStateService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
      ],
    }).compileComponents();

    state = TestBed.inject(WorkspaceSettingsStateService);
    state.skillSettings.set(makeMockSettings());

    fixture = TestBed.createComponent(TabAgentsComponent);
    fixture.detectChanges();
  });

  it('should not show edit panel by default', () => {
    expect(fixture.nativeElement.querySelector('.agent-edit-panel')).toBeNull();
  });

  it('should show edit panel when edit button is clicked', () => {
    const editBtn = fixture.nativeElement.querySelector('.action-btn-edit') as HTMLButtonElement;
    editBtn.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.agent-edit-panel')).toBeTruthy();
  });

  it('should toggle edit panel via toggleEdit method', async () => {
    fixture.componentInstance.toggleEdit(0);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.agent-edit-panel')).toBeTruthy();

    fixture.componentInstance.toggleEdit(0);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.agent-edit-panel')).toBeNull();
  });

  it('should only show one edit panel at a time', async () => {
    fixture.componentInstance.toggleEdit(0);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.agent-edit-panel').length).toBe(1);

    fixture.componentInstance.toggleEdit(1);
    fixture.detectChanges();
    await fixture.whenStable();
    const panels = fixture.nativeElement.querySelectorAll('.agent-edit-panel');
    expect(panels.length).toBe(1);
  });

  it('should rotate chevron when editing', () => {
    fixture.componentInstance.toggleEdit(0);
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('.agent-row');
    expect(rows[0].querySelector('.agent-chevron-open')).toBeTruthy();
    expect(rows[1].querySelector('.agent-chevron-open')).toBeNull();
  });

  it('should render Agent Name input with current value', () => {
    fixture.componentInstance.toggleEdit(0);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('.edit-input-name') as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.value).toBe('Reporting Agent');
  });

  it('should render Role input with current value', () => {
    fixture.componentInstance.toggleEdit(0);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('.edit-input-role') as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.value).toBe('News Aggregator');
  });

  it('should render Responsibilities textarea with current value', () => {
    fixture.componentInstance.toggleEdit(0);
    fixture.detectChanges();
    const textareas = fixture.nativeElement.querySelectorAll('.edit-textarea-bio') as NodeListOf<HTMLTextAreaElement>;
    expect(textareas.length).toBe(2);
    expect(textareas[0].value).toContain('Daily scanning');
  });

  it('should render Agent Name label with info icon', () => {
    fixture.componentInstance.toggleEdit(0);
    fixture.detectChanges();
    const labels = fixture.nativeElement.querySelectorAll('.edit-field-label');
    expect(labels[0].textContent).toContain('Agent Name');
    expect(labels[0].querySelector('.edit-info-icon')).toBeTruthy();
  });

  it('should render Role label with info icon', () => {
    fixture.componentInstance.toggleEdit(0);
    fixture.detectChanges();
    const labels = fixture.nativeElement.querySelectorAll('.edit-field-label');
    expect(labels[1].textContent).toContain('Role');
    expect(labels[1].querySelector('.edit-info-icon')).toBeTruthy();
  });

  it('should render Responsibilities label with info icon', () => {
    fixture.componentInstance.toggleEdit(0);
    fixture.detectChanges();
    const labels = fixture.nativeElement.querySelectorAll('.edit-field-label');
    expect(labels[2].textContent).toContain('Responsibilities');
    expect(labels[2].querySelector('.edit-info-icon')).toBeTruthy();
  });

  it('should render Done button', () => {
    fixture.componentInstance.toggleEdit(0);
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('.edit-done-btn') as HTMLButtonElement;
    expect(btn).toBeTruthy();
    expect(btn.textContent.trim()).toBe('Done');
  });

  it('should close edit panel when Done is clicked', async () => {
    fixture.componentInstance.toggleEdit(0);
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('.edit-done-btn') as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.agent-edit-panel')).toBeNull();
  });

  it('should update agent name on input', () => {
    fixture.componentInstance.toggleEdit(0);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('.edit-input-name') as HTMLInputElement;
    input.value = 'Updated Agent';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(state.skillSettings()?.skills[0].name).toBe('Updated Agent');
  });

  it('should update agent role on input', () => {
    fixture.componentInstance.toggleEdit(0);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('.edit-input-role') as HTMLInputElement;
    input.value = 'New Role';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(state.skillSettings()?.skills[0].role).toBe('New Role');
  });

  it('should update agent responsibilities on textarea input', () => {
    fixture.componentInstance.toggleEdit(0);
    fixture.detectChanges();
    const textareas = fixture.nativeElement.querySelectorAll('.edit-textarea-bio') as NodeListOf<HTMLTextAreaElement>;
    textareas[0].value = 'Updated responsibility';
    textareas[0].dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(state.skillSettings()?.skills[0].responsibilities).toEqual(['Updated responsibility']);
  });

  it('should update second agent when editing index 1', () => {
    fixture.componentInstance.toggleEdit(1);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('.edit-input-name') as HTMLInputElement;
    expect(input.value).toBe('Creative Agent');
    input.value = 'Renamed Creative';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(state.skillSettings()?.skills[1].name).toBe('Renamed Creative');
  });

  it('should not update when settings is null', () => {
    fixture.componentInstance.toggleEdit(0);
    fixture.detectChanges();
    state.skillSettings.set(null);
    fixture.componentInstance.updateAgentField(0, 'name', 'Test');
    expect(state.skillSettings()).toBeNull();
  });

  it('should not update list field when settings is null', () => {
    state.skillSettings.set(null);
    fixture.componentInstance.updateAgentListField(0, 'responsibilities', 'Test');
    expect(state.skillSettings()).toBeNull();
  });

  it('should render edit panel with 2-column grid for name and role', () => {
    fixture.componentInstance.toggleEdit(0);
    fixture.detectChanges();
    const grid = fixture.nativeElement.querySelector('.edit-field-grid');
    expect(grid).toBeTruthy();
  });

  it('should render Expected Outputs textarea with current value', () => {
    fixture.componentInstance.toggleEdit(0);
    fixture.detectChanges();
    const textareas = fixture.nativeElement.querySelectorAll('.edit-textarea-bio') as NodeListOf<HTMLTextAreaElement>;
    expect(textareas[1]).toBeTruthy();
  });

  it('should render Expected Outputs label with info icon', () => {
    fixture.componentInstance.toggleEdit(0);
    fixture.detectChanges();
    const labels = fixture.nativeElement.querySelectorAll('.edit-field-label');
    expect(labels[3].textContent).toContain('Expected Outputs');
    expect(labels[3].querySelector('.edit-info-icon')).toBeTruthy();
  });

  it('should return empty string for responsibilitiesPreview with no responsibilities', () => {
    const agent = { id: 'x', skillId: '', name: 'X', role: '', enabled: true };
    expect(fixture.componentInstance.responsibilitiesPreview(agent)).toBe('');
  });

  it('should return first responsibility for responsibilitiesPreview', () => {
    const agent = { id: 'x', skillId: '', name: 'X', role: '', enabled: true, responsibilities: ['First', 'Second'] };
    expect(fixture.componentInstance.responsibilitiesPreview(agent)).toBe('First');
  });

  it('should return joined responsibilities for responsibilitiesDisplay', () => {
    const agent = { id: 'x', skillId: '', name: 'X', role: '', enabled: true, responsibilities: ['A', 'B'] };
    expect(fixture.componentInstance.responsibilitiesDisplay(agent)).toBe('A\nB');
  });

  it('should return joined expectedOutputs for expectedOutputsDisplay', () => {
    const agent = { id: 'x', skillId: '', name: 'X', role: '', enabled: true, expectedOutputs: ['Out1', 'Out2'] };
    expect(fixture.componentInstance.expectedOutputsDisplay(agent)).toBe('Out1\nOut2');
  });

  it('should update expectedOutputs on textarea input', () => {
    fixture.componentInstance.toggleEdit(0);
    fixture.detectChanges();
    const textareas = fixture.nativeElement.querySelectorAll('.edit-textarea-bio') as NodeListOf<HTMLTextAreaElement>;
    textareas[1].value = 'Output A\nOutput B';
    textareas[1].dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(state.skillSettings()?.skills[0].expectedOutputs).toEqual(['Output A', 'Output B']);
  });
});

describe('TabAgentsComponent (agent without role or persona)', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<TabAgentsComponent>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabAgentsComponent],
      providers: [
        WorkspaceSettingsStateService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
      ],
    }).compileComponents();

    const state = TestBed.inject(WorkspaceSettingsStateService);
    state.skillSettings.set({
      skills: [
        { id: 'sk-bare', skillId: 'basic', name: 'Basic Agent', role: '', enabled: true },
      ],
    });

    fixture = TestBed.createComponent(TabAgentsComponent);
    fixture.detectChanges();
  });

  it('should not render role badge when role is empty', () => {
    const badges = fixture.nativeElement.querySelectorAll('.agent-role-badge');
    expect(badges.length).toBe(0);
  });

  it('should not render persona when not provided', () => {
    const persona = fixture.nativeElement.querySelector('.agent-persona');
    expect(persona).toBeNull();
  });
});
