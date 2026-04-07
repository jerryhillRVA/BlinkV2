import { TestBed } from '@angular/core/testing';
import { VoiceMissionComponent } from './voice-mission.component';

describe('VoiceMissionComponent', () => {
  let component: VoiceMissionComponent;
  let fixture: ReturnType<typeof TestBed.createComponent<VoiceMissionComponent>>;
  let nativeElement: HTMLElement;

  beforeEach(async () => {
    vi.useFakeTimers();
    await TestBed.configureTestingModule({
      imports: [VoiceMissionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(VoiceMissionComponent);
    component = fixture.componentInstance;
    nativeElement = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render mission textarea', () => {
    expect(nativeElement.querySelector('.mission-textarea')).toBeTruthy();
  });

  it('should update mission statement', () => {
    component.updateMission('Test mission');
    expect(component.missionStatement()).toBe('Test mission');
  });

  it('should draft mission with AI', () => {
    component.draftMission();
    expect(component.isDrafting()).toBe(true);

    vi.advanceTimersByTime(2000);
    expect(component.isDrafting()).toBe(false);
    expect(component.missionStatement()).toContain('Empower women over 40');
  });

  it('should show spinner while drafting', () => {
    component.draftMission();
    fixture.detectChanges();

    const btn = nativeElement.querySelector('.btn-ai') as HTMLButtonElement;
    expect(btn.textContent).toContain('Drafting...');
    expect(btn.disabled).toBe(true);
    expect(nativeElement.querySelector('.spinner')).toBeTruthy();

    vi.advanceTimersByTime(2000);
    fixture.detectChanges();

    expect(btn.textContent).toContain('AI Draft');
    expect(btn.disabled).toBe(false);
  });

  it('should show AI Draft SVG icon when not drafting', () => {
    const btn = nativeElement.querySelector('.btn-ai');
    expect(btn?.querySelector('.btn-icon')).toBeTruthy();
    expect(btn?.querySelector('.spinner')).toBeFalsy();
  });

  it('should update mission via textarea input', () => {
    const textarea = nativeElement.querySelector('.mission-textarea') as HTMLTextAreaElement;
    textarea.value = 'New mission value';
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(component.missionStatement()).toBe('New mission value');
  });

  it('should clean up timer on destroy', () => {
    component.draftMission();
    expect(component.isDrafting()).toBe(true);
    fixture.destroy();
    vi.advanceTimersByTime(2000);
    // No error thrown - timer was cleaned up
  });
});
