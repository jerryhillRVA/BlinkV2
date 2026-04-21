import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ContentCreateFormComponent } from './content-create-form.component';
import type {
  AudienceSegment,
  ContentCreatePayload,
  ContentPillar,
  IdeaPayload,
} from '../../content.types';
import { AI_SIMULATION_DELAY_MS } from '../../content.constants';

const PILLARS: ContentPillar[] = [
  { id: 'p1', name: 'Alpha', description: '', color: '#111' },
  { id: 'p2', name: 'Beta', description: '', color: '#222' },
];
const SEGMENTS: AudienceSegment[] = [
  { id: 's1', name: 'S1', description: '' },
];

function make(): ComponentFixture<ContentCreateFormComponent> {
  TestBed.configureTestingModule({ imports: [ContentCreateFormComponent] });
  const fixture = TestBed.createComponent(ContentCreateFormComponent);
  fixture.componentRef.setInput('pillars', PILLARS);
  fixture.componentRef.setInput('segments', SEGMENTS);
  fixture.detectChanges();
  return fixture;
}

describe('ContentCreateFormComponent', () => {
  it('applies initialType=concept when provided and renders Concept form on open', () => {
    TestBed.configureTestingModule({ imports: [ContentCreateFormComponent] });
    const fixture = TestBed.createComponent(ContentCreateFormComponent);
    fixture.componentRef.setInput('pillars', PILLARS);
    fixture.componentRef.setInput('segments', SEGMENTS);
    fixture.componentRef.setInput('initialType', 'concept');
    fixture.detectChanges();
    const title: HTMLElement = fixture.nativeElement.querySelector('.modal-title');
    expect(title.textContent).toContain('Create Concept');
    const storeFromComp = (fixture.componentInstance as unknown as {
      store: { state: () => { type: string } };
    }).store;
    expect(storeFromComp.state().type).toBe('concept');
  });

  it('applies initialType=production-brief when provided', () => {
    TestBed.configureTestingModule({ imports: [ContentCreateFormComponent] });
    const fixture = TestBed.createComponent(ContentCreateFormComponent);
    fixture.componentRef.setInput('pillars', PILLARS);
    fixture.componentRef.setInput('segments', SEGMENTS);
    fixture.componentRef.setInput('initialType', 'production-brief');
    fixture.detectChanges();
    const storeFromComp = (fixture.componentInstance as unknown as {
      store: { state: () => { type: string } };
    }).store;
    expect(storeFromComp.state().type).toBe('production-brief');
  });

  it('defaults to Idea when initialType is not provided', () => {
    const fixture = make();
    const storeFromComp = (fixture.componentInstance as unknown as {
      store: { state: () => { type: string } };
    }).store;
    expect(storeFromComp.state().type).toBe('idea');
  });

  it('renders the Type dropdown with per-type colored icons', () => {
    const fixture = make();
    const typeDropdown = (fixture.componentInstance as unknown as {
      typeDropdown: Array<{ value: string; iconPaths?: string[]; iconColor?: string }>;
    }).typeDropdown;
    const byValue = Object.fromEntries(typeDropdown.map((o) => [o.value, o]));
    expect(byValue['idea'].iconPaths?.length).toBeGreaterThan(0);
    expect(byValue['idea'].iconColor).toBeTruthy();
    expect(byValue['concept'].iconPaths?.length).toBeGreaterThan(0);
    expect(byValue['concept'].iconColor).toBeTruthy();
    expect(byValue['production-brief'].iconPaths?.length).toBeGreaterThan(0);
    expect(byValue['production-brief'].iconColor).toBeTruthy();
    // The three colors should be distinct (blue/purple/orange from figma)
    const colors = new Set([
      byValue['idea'].iconColor,
      byValue['concept'].iconColor,
      byValue['production-brief'].iconColor,
    ]);
    expect(colors.size).toBe(3);
    // The trigger should render the selected option's icon
    expect(fixture.nativeElement.querySelector('.dropdown-trigger .dropdown-option-icon')).toBeTruthy();
  });

  function findFooterBtn(
    fixture: ComponentFixture<ContentCreateFormComponent>,
    label: string,
  ): HTMLButtonElement {
    return Array.from(
      fixture.nativeElement.querySelectorAll('.modal-footer button') as NodeListOf<HTMLButtonElement>,
    ).find((b) => b.textContent?.includes(label)) as HTMLButtonElement;
  }

  it('defaults to Idea type with Quick Add mode — Save Idea button disabled initially', () => {
    const fixture = make();
    const title: HTMLElement = fixture.nativeElement.querySelector('.modal-title');
    expect(title.textContent).toContain('Create New Content');
    const saveBtn = findFooterBtn(fixture, 'Save Idea');
    expect(saveBtn.disabled).toBe(true);
  });

  it('emits save with IdeaPayload when title provided and Save Idea clicked', () => {
    const fixture = make();
    const emitted: ContentCreatePayload[] = [];
    fixture.componentInstance.saveContent.subscribe((p) => emitted.push(p));

    const input: HTMLInputElement = fixture.nativeElement.querySelector('#idea-title');
    input.value = 'My Idea';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const saveBtn = findFooterBtn(fixture, 'Save Idea');
    expect(saveBtn.disabled).toBe(false);
    saveBtn.click();
    fixture.detectChanges();

    expect(emitted).toHaveLength(1);
    const payload = emitted[0] as IdeaPayload;
    expect(payload.kind).toBe('idea');
    expect(payload.title).toBe('My Idea');
  });

  it('cancel emits from Cancel button', () => {
    const fixture = make();
    let cancelled = 0;
    fixture.componentInstance.cancelCreate.subscribe(() => cancelled++);
    const cancelBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.btn-modal-cancel');
    cancelBtn.click();
    expect(cancelled).toBe(1);
  });

  it('switching type to production-brief swaps footer to Save Brief + Draft Assets', () => {
    const fixture = make();
    const comp = fixture.componentInstance;
    // simulate the type dropdown selecting production-brief
    // use the protected setType via bracket-access in tests
    (comp as unknown as { setType: (v: string) => void }).setType('production-brief');
    fixture.detectChanges();

    const btns = fixture.nativeElement.querySelectorAll('button');
    const texts = Array.from(btns as NodeListOf<HTMLButtonElement>).map(
      (b) => b.textContent?.trim() ?? '',
    );
    expect(texts.some((t) => t.includes('Save Brief'))).toBe(true);
    expect(texts.some((t) => t.includes('Draft Assets'))).toBe(true);
  });

  it('concept + AI generated shows Move to Production + Save Concept in footer', () => {
    vi.useFakeTimers();
    try {
      const fixture = make();
      const comp = fixture.componentInstance;
      (comp as unknown as { setType: (v: string) => void }).setType('concept');
      fixture.detectChanges();

      // Pre-fill + trigger AI generation to expose full form
      const titleInput: HTMLInputElement = fixture.nativeElement.querySelector('#concept-title');
      titleInput.value = 'T';
      titleInput.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      const objButtons: NodeListOf<HTMLButtonElement> =
        fixture.nativeElement.querySelectorAll('.objective-btn');
      objButtons[0].click(); // awareness
      fixture.detectChanges();

      const generateBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.btn-generate');
      generateBtn.click();
      fixture.detectChanges();
      vi.advanceTimersByTime(AI_SIMULATION_DELAY_MS);
      fixture.detectChanges();

      const footerBtns: NodeListOf<HTMLButtonElement> =
        fixture.nativeElement.querySelectorAll('.modal-footer button');
      const texts = Array.from(footerBtns).map((b) => b.textContent?.trim() ?? '');
      expect(texts.some((t) => t.includes('Save Concept'))).toBe(true);
      expect(texts.some((t) => t.includes('Move to Production'))).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('save button label is "Complete Production" when in production mode', () => {
    const fixture = make();
    const storeFromComp = (fixture.componentInstance as unknown as {
      store: { setType: (t: string) => void; patch: (p: object) => void };
    }).store;
    storeFromComp.setType('concept');
    storeFromComp.patch({
      title: 'T',
      description: 'x'.repeat(60),
      pillarIds: ['p1'],
      hook: 'h',
      objective: 'engagement',
      platform: 'instagram',
      contentType: 'reel',
      segmentIds: ['s1'],
      conceptAiGenerated: true,
      isProductionMode: true,
    });
    fixture.detectChanges();
    const createBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.btn-modal-create');
    expect(createBtn.textContent).toContain('Complete Production');
  });

  it('onMoveToProductionClick emits when validation passes, stays silent when not', () => {
    const fixture = make();
    const emitted: unknown[] = [];
    fixture.componentInstance.moveToProduction.subscribe((p) => emitted.push(p));
    const storeFromComp = (fixture.componentInstance as unknown as {
      store: { setType: (t: string) => void; patch: (p: object) => void };
    }).store;
    storeFromComp.setType('concept');
    storeFromComp.patch({ conceptAiGenerated: true });
    fixture.detectChanges();
    // Click while invalid — should not emit
    const mtp: HTMLButtonElement | null = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>,
    ).find((b) => b.textContent?.includes('Move to Production')) ?? null;
    if (mtp) mtp.click();
    expect(emitted).toHaveLength(0);
    // Now fill validity and click
    storeFromComp.patch({
      title: 'T',
      description: 'x'.repeat(60),
      pillarIds: ['p1'],
      hook: 'h',
      objective: 'engagement',
      platform: 'instagram',
      contentType: 'reel',
      segmentIds: ['s1'],
    });
    fixture.detectChanges();
    (fixture.componentInstance as unknown as {
      onMoveToProductionClick: () => void;
    }).onMoveToProductionClick();
    expect(emitted).toHaveLength(1);
  });

  it('onDraftAssetsClick emits a brief payload', () => {
    const fixture = make();
    const emitted: unknown[] = [];
    fixture.componentInstance.draftAssets.subscribe((p) => emitted.push(p));
    const storeFromComp = (fixture.componentInstance as unknown as {
      store: { setType: (t: string) => void; patch: (p: object) => void };
    }).store;
    storeFromComp.setType('production-brief');
    storeFromComp.patch({
      title: 'T',
      platform: 'instagram',
      contentType: 'reel',
      objective: 'engagement',
      keyMessage: 'msg',
      segmentIds: ['s1'],
    });
    fixture.detectChanges();
    (fixture.componentInstance as unknown as {
      onDraftAssetsClick: () => void;
    }).onDraftAssetsClick();
    expect(emitted).toHaveLength(1);
  });

  it('Idea Quick Add renders a "Create Concept" action button alongside Save Idea', () => {
    const fixture = make();
    const footerBtns: NodeListOf<HTMLButtonElement> =
      fixture.nativeElement.querySelectorAll('.modal-footer button');
    const labels = Array.from(footerBtns).map((b) => b.textContent?.trim() ?? '');
    expect(labels.some((t) => t.includes('Save Idea'))).toBe(true);
    expect(labels.some((t) => t.includes('Create Concept'))).toBe(true);
  });

  it('"Create Concept" is disabled when idea is invalid, enabled when title is filled', () => {
    const fixture = make();
    const getBtn = (): HTMLButtonElement | null =>
      Array.from(
        fixture.nativeElement.querySelectorAll('.modal-footer button') as NodeListOf<HTMLButtonElement>,
      ).find((b) => b.textContent?.includes('Create Concept')) ?? null;
    expect(getBtn()?.disabled).toBe(true);
    const input: HTMLInputElement = fixture.nativeElement.querySelector('#idea-title');
    input.value = 'My Idea';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(getBtn()?.disabled).toBe(false);
  });

  it('clicking "Create Concept" emits createConcept with an IdeaPayload and switches type to concept', () => {
    const fixture = make();
    const emitted: IdeaPayload[] = [];
    fixture.componentInstance.createConcept.subscribe((p) => emitted.push(p));

    const input: HTMLInputElement = fixture.nativeElement.querySelector('#idea-title');
    input.value = 'Promote-me';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const btn = Array.from(
      fixture.nativeElement.querySelectorAll('.modal-footer button') as NodeListOf<HTMLButtonElement>,
    ).find((b) => b.textContent?.includes('Create Concept')) as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();

    expect(emitted).toHaveLength(1);
    expect(emitted[0].kind).toBe('idea');
    expect(emitted[0].title).toBe('Promote-me');

    // Modal should now render Concept form, not Idea
    const title: HTMLElement = fixture.nativeElement.querySelector('.modal-title');
    expect(title.textContent).toContain('Create Concept');
    // Title/description must be preserved in the store after type switch
    const storeFromComp = (fixture.componentInstance as unknown as {
      store: { state: () => { title: string; type: string } };
    }).store;
    expect(storeFromComp.state().title).toBe('Promote-me');
    expect(storeFromComp.state().type).toBe('concept');
    // Concept section pre-gen phase should be visible
    expect(fixture.nativeElement.querySelector('#concept-title')).not.toBeNull();
  });

  it('"Create Concept" does NOT appear in Idea Generate mode', () => {
    const fixture = make();
    const storeFromComp = (fixture.componentInstance as unknown as {
      store: { setIdeaMode: (m: string) => void };
    }).store;
    storeFromComp.setIdeaMode('generate');
    fixture.detectChanges();
    const labels = Array.from(
      fixture.nativeElement.querySelectorAll('.modal-footer button') as NodeListOf<HTMLButtonElement>,
    ).map((b) => b.textContent?.trim() ?? '');
    expect(labels.some((t) => t.includes('Create Concept'))).toBe(false);
  });

  it('Idea generate-mode emits saveMany with selected payloads', () => {
    const fixture = make();
    const comp = fixture.componentInstance;
    const emitted: IdeaPayload[][] = [];
    comp.saveMany.subscribe((v) => emitted.push(v));

    // Switch to Idea generate mode and inject generated ideas directly into store
    const storeFromComp = (comp as unknown as { store: { patch: (p: object) => void; setIdeaMode: (m: string) => void } }).store;
    storeFromComp.setIdeaMode('generate');
    storeFromComp.patch({
      generatedIdeas: [
        { id: 'g1', title: 'A', rationale: 'r', pillarId: 'p1' },
      ],
      selectedGeneratedIds: ['g1'],
    });
    fixture.detectChanges();

    const saveBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.btn-modal-create');
    saveBtn.click();

    expect(emitted).toHaveLength(1);
    expect(emitted[0]).toHaveLength(1);
    expect(emitted[0][0].title).toBe('A');
  });
});
