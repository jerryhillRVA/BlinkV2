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
        enabled: true,
      },
      {
        id: 'sk2', skillId: 'creative', name: 'Creative Agent', role: 'Content Specialist',
        persona: 'Specializes in high-engagement social media content.',
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

  it('should render card description mentioning biography', () => {
    const desc = fixture.nativeElement.querySelector('.card-description');
    expect(desc?.textContent).toContain('full biography');
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

  it('should display persona as preview text', () => {
    const personas = fixture.nativeElement.querySelectorAll('.agent-persona');
    expect(personas.length).toBe(2);
    expect(personas[0].textContent).toContain('scanning RSS feeds');
  });

  it('should render edit and remove buttons', () => {
    expect(fixture.nativeElement.querySelectorAll('.action-btn-edit').length).toBe(2);
    expect(fixture.nativeElement.querySelectorAll('.action-btn-remove').length).toBe(2);
  });

  it('should render chevron icons', () => {
    expect(fixture.nativeElement.querySelectorAll('.agent-chevron').length).toBe(2);
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
    expect(fixture.nativeElement.querySelector('.tab-card')).toBeNull();
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
    expect(input.value).toBe('Reporting Agent');
  });

  it('should render Role input with current value', () => {
    fixture.componentInstance.toggleEdit(0);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('.edit-input-role') as HTMLInputElement;
    expect(input.value).toBe('News Aggregator');
  });

  it('should render single Full Bio textarea with persona value', () => {
    fixture.componentInstance.toggleEdit(0);
    fixture.detectChanges();
    const textareas = fixture.nativeElement.querySelectorAll('.edit-textarea-bio') as NodeListOf<HTMLTextAreaElement>;
    expect(textareas.length).toBe(1);
    expect(textareas[0].value).toContain('scanning RSS feeds');
  });

  it('should render 3 labels: Agent Name, Role, Full Bio', () => {
    fixture.componentInstance.toggleEdit(0);
    fixture.detectChanges();
    const labels = fixture.nativeElement.querySelectorAll('.edit-field-label');
    expect(labels.length).toBe(3);
    expect(labels[0].textContent).toContain('Agent Name');
    expect(labels[1].textContent).toContain('Role');
    expect(labels[2].textContent).toContain('Full Bio');
  });

  it('should render tooltips on all labels', () => {
    fixture.componentInstance.toggleEdit(0);
    fixture.detectChanges();
    const tooltips = fixture.nativeElement.querySelectorAll('.edit-field-label app-tooltip');
    expect(tooltips.length).toBe(3);
  });

  it('should render Done button', () => {
    fixture.componentInstance.toggleEdit(0);
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('.edit-done-btn') as HTMLButtonElement;
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
    expect(state.skillSettings()?.skills[0].name).toBe('Updated Agent');
  });

  it('should update agent role on input', () => {
    fixture.componentInstance.toggleEdit(0);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('.edit-input-role') as HTMLInputElement;
    input.value = 'New Role';
    input.dispatchEvent(new Event('input'));
    expect(state.skillSettings()?.skills[0].role).toBe('New Role');
  });

  it('should update agent persona on bio textarea input', () => {
    fixture.componentInstance.toggleEdit(0);
    fixture.detectChanges();
    const textarea = fixture.nativeElement.querySelector('.edit-textarea-bio') as HTMLTextAreaElement;
    textarea.value = 'Updated bio text';
    textarea.dispatchEvent(new Event('input'));
    expect(state.skillSettings()?.skills[0].persona).toBe('Updated bio text');
  });

  it('should not update when settings is null', () => {
    fixture.componentInstance.toggleEdit(0);
    fixture.detectChanges();
    state.skillSettings.set(null);
    fixture.componentInstance.updateAgentField(0, 'name', 'Test');
    expect(state.skillSettings()).toBeNull();
  });

  it('should return fallback text for bioPreview when persona is empty', () => {
    const agent = { id: 'x', skillId: '', name: 'X', role: '', enabled: true };
    expect(fixture.componentInstance.bioPreview(agent)).toBe('No biography provided yet.');
  });

  it('should return persona for bioPreview when set', () => {
    const agent = { id: 'x', skillId: '', name: 'X', role: '', enabled: true, persona: 'A great agent' };
    expect(fixture.componentInstance.bioPreview(agent)).toBe('A great agent');
  });
});

describe('TabAgentsComponent (agent without role)', () => {
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

  it('should show fallback bio text when persona is not provided', () => {
    const persona = fixture.nativeElement.querySelector('.agent-persona');
    expect(persona.textContent).toContain('No biography provided yet.');
  });
});
