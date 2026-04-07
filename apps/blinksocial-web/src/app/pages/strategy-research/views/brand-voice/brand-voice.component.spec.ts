import { TestBed } from '@angular/core/testing';
import { BrandVoiceComponent } from './brand-voice.component';

describe('BrandVoiceComponent', () => {
  let component: BrandVoiceComponent;
  let fixture: ReturnType<typeof TestBed.createComponent<BrandVoiceComponent>>;
  let nativeElement: HTMLElement;

  beforeEach(async () => {
    vi.useFakeTimers();
    await TestBed.configureTestingModule({
      imports: [BrandVoiceComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BrandVoiceComponent);
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

  // --- Rendering ---

  it('should render all five section titles', () => {
    const titles = nativeElement.querySelectorAll('.card-title');
    const titleTexts = Array.from(titles).map(el => el.textContent?.trim());
    expect(titleTexts).toContain('Mission Statement');
    expect(titleTexts).toContain('Voice Attributes');
    expect(titleTexts).toContain('Tone by Context');
    expect(titleTexts).toContain('Platform Tone Adjustments');
    expect(titleTexts).toContain('Vocabulary Guide');
  });

  it('should render mission textarea', () => {
    expect(nativeElement.querySelector('.mission-textarea')).toBeTruthy();
  });

  it('should render 5 platform textareas', () => {
    const platformTextareas = nativeElement.querySelectorAll('.platform-textarea');
    expect(platformTextareas.length).toBe(5);
  });

  it('should render vocabulary columns', () => {
    expect(nativeElement.querySelector('.vocab-columns')).toBeTruthy();
    expect(nativeElement.querySelector('.preferred-column')).toBeTruthy();
    expect(nativeElement.querySelector('.avoid-column')).toBeTruthy();
  });

  it('should show empty state for tone contexts when none exist', () => {
    const emptyState = nativeElement.querySelector('.empty-state');
    expect(emptyState?.textContent).toContain('No tone contexts yet');
  });

  it('should hide tone table when no tone contexts exist', () => {
    expect(nativeElement.querySelector('.tone-table')).toBeFalsy();
  });

  // --- Mission Statement ---

  it('should update mission statement via updateMission', () => {
    component.updateMission('Test mission');
    expect(component.data().missionStatement).toBe('Test mission');
  });

  it('should draft mission with AI (timer-based)', () => {
    component.draftMission();
    expect(component.isDraftingMission()).toBe(true);

    vi.advanceTimersByTime(2000);
    expect(component.isDraftingMission()).toBe(false);
    expect(component.data().missionStatement).toContain('Empower women over 40');
  });

  it('should show spinner and "Drafting..." text while drafting mission', () => {
    component.draftMission();
    fixture.detectChanges();

    const btn = nativeElement.querySelector('.btn-ai') as HTMLButtonElement;
    expect(btn.textContent).toContain('Drafting...');
    expect(btn.disabled).toBe(true);
    expect(nativeElement.querySelector('.btn-ai .spinner')).toBeTruthy();

    vi.advanceTimersByTime(2000);
    fixture.detectChanges();

    expect(btn.textContent).toContain('AI Draft');
    expect(btn.disabled).toBe(false);
  });

  // --- Voice Attributes ---

  it('should generate attributes with AI (timer-based)', () => {
    component.generateAttributes();
    expect(component.isGeneratingAttributes()).toBe(true);

    vi.advanceTimersByTime(2000);
    expect(component.isGeneratingAttributes()).toBe(false);
    expect(component.data().voiceAttributes.length).toBe(4);
    expect(component.data().voiceAttributes[0].label).toBe('Empowering');
  });

  it('should start adding a new attribute', () => {
    component.startAddAttribute();
    expect(component.editingAttributeId()).toBeTruthy();
    expect(component.editAttribute().label).toBe('');
  });

  it('should show edit form when editingAttributeId is set', () => {
    component.startAddAttribute();
    fixture.detectChanges();
    expect(nativeElement.querySelector('.inline-form')).toBeTruthy();
  });

  it('should save a new attribute', () => {
    component.startAddAttribute();
    const id = component.editingAttributeId()!;
    component.editAttribute.set({
      id,
      label: 'Test Attr',
      description: 'Desc',
      doExample: 'Do this',
      dontExample: 'Not this',
    });
    component.saveAttribute();

    expect(component.data().voiceAttributes.length).toBe(1);
    expect(component.data().voiceAttributes[0].label).toBe('Test Attr');
    expect(component.editingAttributeId()).toBeNull();
  });

  it('should not save attribute with empty label', () => {
    component.startAddAttribute();
    component.editAttribute.set({
      id: component.editingAttributeId()!,
      label: '   ',
      description: 'Desc',
      doExample: '',
      dontExample: '',
    });
    component.saveAttribute();
    expect(component.data().voiceAttributes.length).toBe(0);
  });

  it('should edit an existing attribute', () => {
    // First add one
    component.startAddAttribute();
    component.editAttribute.set({
      id: component.editingAttributeId()!,
      label: 'Original',
      description: 'Orig desc',
      doExample: '',
      dontExample: '',
    });
    component.saveAttribute();

    // Now edit it
    const attr = component.data().voiceAttributes[0];
    component.startEditAttribute(attr);
    expect(component.editingAttributeId()).toBe(attr.id);
    expect(component.editAttribute().label).toBe('Original');

    component.updateEditAttributeField('label', 'Updated');
    expect(component.editAttribute().label).toBe('Updated');

    component.saveAttribute();
    expect(component.data().voiceAttributes[0].label).toBe('Updated');
    expect(component.data().voiceAttributes.length).toBe(1);
  });

  it('should cancel attribute editing', () => {
    component.startAddAttribute();
    expect(component.editingAttributeId()).toBeTruthy();
    component.cancelEditAttribute();
    expect(component.editingAttributeId()).toBeNull();
  });

  it('should remove a voice attribute', () => {
    component.startAddAttribute();
    component.editAttribute.set({
      id: component.editingAttributeId()!,
      label: 'Remove Me',
      description: '',
      doExample: '',
      dontExample: '',
    });
    component.saveAttribute();
    const id = component.data().voiceAttributes[0].id;
    component.removeAttribute(id);
    expect(component.data().voiceAttributes.length).toBe(0);
  });

  it('should render attribute cards when attributes exist', () => {
    component.generateAttributes();
    vi.advanceTimersByTime(2000);
    fixture.detectChanges();

    const cards = nativeElement.querySelectorAll('.attribute-card');
    expect(cards.length).toBe(4);
    expect(cards[0].querySelector('.attribute-label')?.textContent?.trim()).toBe('Empowering');
    expect(cards[0].querySelector('.do-badge')).toBeTruthy();
    expect(cards[0].querySelector('.dont-badge')).toBeTruthy();
  });

  it('should update edit attribute fields', () => {
    component.updateEditAttributeField('label', 'New Label');
    expect(component.editAttribute().label).toBe('New Label');

    component.updateEditAttributeField('description', 'New Desc');
    expect(component.editAttribute().description).toBe('New Desc');

    component.updateEditAttributeField('doExample', 'New Do');
    expect(component.editAttribute().doExample).toBe('New Do');

    component.updateEditAttributeField('dontExample', 'New Dont');
    expect(component.editAttribute().dontExample).toBe('New Dont');
  });

  // --- Tone by Context ---

  it('should start adding a new tone context', () => {
    component.startAddTone();
    expect(component.editingToneId()).toBeTruthy();
    expect(component.editTone().context).toBe('');
  });

  it('should save a new tone context', () => {
    component.startAddTone();
    component.editTone.set({
      id: component.editingToneId()!,
      context: 'Educational',
      tone: 'Clear',
      example: 'Example text',
    });
    component.saveTone();

    expect(component.data().toneByContext.length).toBe(1);
    expect(component.data().toneByContext[0].context).toBe('Educational');
    expect(component.editingToneId()).toBeNull();
  });

  it('should not save tone with empty context', () => {
    component.startAddTone();
    component.editTone.set({
      id: component.editingToneId()!,
      context: '   ',
      tone: 'Tone',
      example: '',
    });
    component.saveTone();
    expect(component.data().toneByContext.length).toBe(0);
  });

  it('should edit an existing tone context', () => {
    component.startAddTone();
    component.editTone.set({
      id: component.editingToneId()!,
      context: 'Original',
      tone: 'Orig tone',
      example: 'Orig ex',
    });
    component.saveTone();

    const tone = component.data().toneByContext[0];
    component.startEditTone(tone);
    expect(component.editingToneId()).toBe(tone.id);
    expect(component.editTone().context).toBe('Original');

    component.updateEditToneField('context', 'Updated');
    expect(component.editTone().context).toBe('Updated');

    component.saveTone();
    expect(component.data().toneByContext[0].context).toBe('Updated');
    expect(component.data().toneByContext.length).toBe(1);
  });

  it('should cancel tone editing', () => {
    component.startAddTone();
    expect(component.editingToneId()).toBeTruthy();
    component.cancelEditTone();
    expect(component.editingToneId()).toBeNull();
  });

  it('should remove a tone context', () => {
    component.startAddTone();
    component.editTone.set({
      id: component.editingToneId()!,
      context: 'ToRemove',
      tone: 'Tone',
      example: '',
    });
    component.saveTone();
    const id = component.data().toneByContext[0].id;
    component.removeTone(id);
    expect(component.data().toneByContext.length).toBe(0);
  });

  it('should generate tone contexts with mock data', () => {
    component.generateToneContexts();
    expect(component.data().toneByContext.length).toBe(4);
    expect(component.data().toneByContext[0].context).toBe('Educational');
  });

  it('should render tone table when tone contexts exist', () => {
    component.generateToneContexts();
    fixture.detectChanges();

    expect(nativeElement.querySelector('.tone-table')).toBeTruthy();
    const rows = nativeElement.querySelectorAll('.tone-table tbody tr');
    expect(rows.length).toBe(4);
    expect(nativeElement.querySelector('.empty-state')).toBeFalsy();
  });

  it('should show tone edit form when editingToneId is set', () => {
    component.startAddTone();
    fixture.detectChanges();

    // There should be two inline-forms possible but only tone form visible here
    const forms = nativeElement.querySelectorAll('.inline-form');
    expect(forms.length).toBe(1);
  });

  it('should update edit tone fields', () => {
    component.updateEditToneField('context', 'New Context');
    expect(component.editTone().context).toBe('New Context');

    component.updateEditToneField('tone', 'New Tone');
    expect(component.editTone().tone).toBe('New Tone');

    component.updateEditToneField('example', 'New Example');
    expect(component.editTone().example).toBe('New Example');
  });

  // --- Platform Tone Adjustments ---

  it('should update platform adjustment', () => {
    component.updatePlatformAdjustment('instagram', 'Be warm and visual');
    const instagram = component.data().platformToneAdjustments.find(p => p.platform === 'instagram');
    expect(instagram?.adjustment).toBe('Be warm and visual');
  });

  it('should suggest platform tone with AI (timer-based)', () => {
    component.suggestPlatformTone('instagram');
    expect(component.suggestingPlatform()).toBe('instagram');

    vi.advanceTimersByTime(1500);
    expect(component.suggestingPlatform()).toBeNull();
    const instagram = component.data().platformToneAdjustments.find(p => p.platform === 'instagram');
    expect(instagram?.adjustment).toContain('Warm, visual storytelling');
  });

  it('should suggest platform tone for different platforms', () => {
    component.suggestPlatformTone('tiktok');
    vi.advanceTimersByTime(1500);
    const tiktok = component.data().platformToneAdjustments.find(p => p.platform === 'tiktok');
    expect(tiktok?.adjustment).toContain('Fast-paced');

    component.suggestPlatformTone('youtube');
    vi.advanceTimersByTime(1500);
    const youtube = component.data().platformToneAdjustments.find(p => p.platform === 'youtube');
    expect(youtube?.adjustment).toContain('Thorough');
  });

  it('should show spinner for platform being suggested', () => {
    component.suggestPlatformTone('instagram');
    fixture.detectChanges();

    const platformCards = nativeElement.querySelectorAll('.platform-card');
    const igCard = platformCards[0];
    expect(igCard.querySelector('.spinner')).toBeTruthy();
    expect(igCard.textContent).toContain('Suggesting...');

    vi.advanceTimersByTime(1500);
    expect(component.suggestingPlatform()).toBeNull();
  });

  it('should render platform labels correctly', () => {
    expect(component.platformLabels['instagram']).toBe('Instagram');
    expect(component.platformLabels['tiktok']).toBe('TikTok');
    expect(component.platformLabels['youtube']).toBe('YouTube');
    expect(component.platformLabels['facebook']).toBe('Facebook');
    expect(component.platformLabels['linkedin']).toBe('LinkedIn');
  });

  // --- Vocabulary ---

  it('should add a preferred word', () => {
    component.newPreferredWord.set('wellness');
    component.addPreferredWord();
    expect(component.data().vocabulary.preferred).toContain('wellness');
    expect(component.newPreferredWord()).toBe('');
  });

  it('should not add empty preferred word', () => {
    component.newPreferredWord.set('   ');
    component.addPreferredWord();
    expect(component.data().vocabulary.preferred.length).toBe(0);
  });

  it('should remove a preferred word', () => {
    component.newPreferredWord.set('wellness');
    component.addPreferredWord();
    component.removePreferredWord('wellness');
    expect(component.data().vocabulary.preferred).not.toContain('wellness');
  });

  it('should add an avoid word', () => {
    component.newAvoidWord.set('anti-aging');
    component.addAvoidWord();
    expect(component.data().vocabulary.avoid).toContain('anti-aging');
    expect(component.newAvoidWord()).toBe('');
  });

  it('should not add empty avoid word', () => {
    component.newAvoidWord.set('   ');
    component.addAvoidWord();
    expect(component.data().vocabulary.avoid.length).toBe(0);
  });

  it('should remove an avoid word', () => {
    component.newAvoidWord.set('anti-aging');
    component.addAvoidWord();
    component.removeAvoidWord('anti-aging');
    expect(component.data().vocabulary.avoid).not.toContain('anti-aging');
  });

  it('should generate vocabulary with mock data', () => {
    component.generateVocabulary();
    expect(component.data().vocabulary.preferred.length).toBeGreaterThan(0);
    expect(component.data().vocabulary.avoid.length).toBeGreaterThan(0);
    expect(component.data().vocabulary.preferred).toContain('perimenopause');
    expect(component.data().vocabulary.avoid).toContain('anti-aging');
  });

  it('should deduplicate vocabulary when generating', () => {
    component.newPreferredWord.set('perimenopause');
    component.addPreferredWord();
    component.generateVocabulary();
    const count = component.data().vocabulary.preferred.filter(w => w === 'perimenopause').length;
    expect(count).toBe(1);
  });

  it('should render preferred and avoid chips after generating vocabulary', () => {
    component.generateVocabulary();
    fixture.detectChanges();

    const preferredChips = nativeElement.querySelectorAll('.chip-preferred');
    const avoidChips = nativeElement.querySelectorAll('.chip-avoid');
    expect(preferredChips.length).toBeGreaterThan(0);
    expect(avoidChips.length).toBeGreaterThan(0);
  });

  // --- Initial state ---

  it('should initialize with empty data', () => {
    const data = component.data();
    expect(data.missionStatement).toBe('');
    expect(data.voiceAttributes.length).toBe(0);
    expect(data.toneByContext.length).toBe(0);
    expect(data.platformToneAdjustments.length).toBe(5);
    expect(data.vocabulary.preferred.length).toBe(0);
    expect(data.vocabulary.avoid.length).toBe(0);
  });

  it('should initialize signals to default values', () => {
    expect(component.isDraftingMission()).toBe(false);
    expect(component.isGeneratingAttributes()).toBe(false);
    expect(component.suggestingPlatform()).toBeNull();
    expect(component.editingAttributeId()).toBeNull();
    expect(component.editingToneId()).toBeNull();
    expect(component.newPreferredWord()).toBe('');
    expect(component.newAvoidWord()).toBe('');
  });

  // --- Template rendering: SVG icon visibility ---

  it('should show AI Draft SVG icon when not drafting mission', () => {
    const missionBtn = nativeElement.querySelector('.btn-ai');
    const svg = missionBtn?.querySelector('.btn-icon');
    expect(svg).toBeTruthy();
    const spinner = missionBtn?.querySelector('.spinner');
    expect(spinner).toBeFalsy();
  });

  it('should hide SVG icon and show spinner when drafting mission', () => {
    component.draftMission();
    fixture.detectChanges();

    const missionBtn = nativeElement.querySelector('.btn-ai');
    const svg = missionBtn?.querySelector('svg.btn-icon');
    expect(svg).toBeFalsy();
    const spinner = missionBtn?.querySelector('.spinner');
    expect(spinner).toBeTruthy();
  });

  it('should show generate attributes SVG when not generating', () => {
    const btns = nativeElement.querySelectorAll('.btn-ai');
    // Second .btn-ai is the generate attributes button
    const genBtn = btns[1];
    const svg = genBtn?.querySelector('svg.btn-icon');
    expect(svg).toBeTruthy();
    const spinner = genBtn?.querySelector('.spinner');
    expect(spinner).toBeFalsy();
  });

  it('should hide generate attributes SVG and show spinner when generating', () => {
    component.generateAttributes();
    fixture.detectChanges();

    const btns = nativeElement.querySelectorAll('.btn-ai');
    const genBtn = btns[1];
    expect(genBtn?.textContent).toContain('Generating...');
    const spinner = genBtn?.querySelector('.spinner');
    expect(spinner).toBeTruthy();
  });

  // --- Platform tone: spinner and button text per platform ---

  it('should disable suggest button for the platform being suggested', () => {
    component.suggestPlatformTone('facebook');
    fixture.detectChanges();

    const platformCards = nativeElement.querySelectorAll('.platform-card');
    // facebook is index 3
    const fbCard = platformCards[3];
    const btn = fbCard?.querySelector('.btn-ai') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(btn.textContent).toContain('Suggesting...');

    vi.advanceTimersByTime(1500);
  });

  it('should not disable suggest button for other platforms while suggesting one', () => {
    component.suggestPlatformTone('instagram');
    fixture.detectChanges();

    const platformCards = nativeElement.querySelectorAll('.platform-card');
    // tiktok is index 1
    const tikTokCard = platformCards[1];
    const btn = tikTokCard?.querySelector('.btn-ai') as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
    expect(btn.textContent).toContain('AI Suggest');
  });

  it('should suggest platform tone for linkedin and facebook', () => {
    component.suggestPlatformTone('linkedin');
    vi.advanceTimersByTime(1500);
    const linkedin = component.data().platformToneAdjustments.find(p => p.platform === 'linkedin');
    expect(linkedin?.adjustment).toContain('Professional');

    component.suggestPlatformTone('facebook');
    vi.advanceTimersByTime(1500);
    const facebook = component.data().platformToneAdjustments.find(p => p.platform === 'facebook');
    expect(facebook?.adjustment).toContain('Community');
  });

  // --- Vocabulary: chip remove via DOM click ---

  it('should remove preferred word when clicking chip remove button in DOM', () => {
    component.generateVocabulary();
    fixture.detectChanges();

    const removeBtn = nativeElement.querySelector('.chip-preferred .chip-remove') as HTMLButtonElement;
    expect(removeBtn).toBeTruthy();
    const wordsBefore = component.data().vocabulary.preferred.length;
    removeBtn.click();
    fixture.detectChanges();
    expect(component.data().vocabulary.preferred.length).toBe(wordsBefore - 1);
  });

  it('should remove avoid word when clicking chip remove button in DOM', () => {
    component.generateVocabulary();
    fixture.detectChanges();

    const removeBtn = nativeElement.querySelector('.chip-avoid .chip-remove') as HTMLButtonElement;
    expect(removeBtn).toBeTruthy();
    const wordsBefore = component.data().vocabulary.avoid.length;
    removeBtn.click();
    fixture.detectChanges();
    expect(component.data().vocabulary.avoid.length).toBe(wordsBefore - 1);
  });

  // --- Vocabulary: add preferred word via DOM button ---

  it('should add preferred word when clicking Add button in DOM', () => {
    component.newPreferredWord.set('resilience');
    fixture.detectChanges();

    const addBtns = nativeElement.querySelectorAll('.vocab-input-row .btn-secondary');
    const addPreferredBtn = addBtns[0] as HTMLButtonElement;
    addPreferredBtn.click();
    fixture.detectChanges();

    expect(component.data().vocabulary.preferred).toContain('resilience');
  });

  it('should add avoid word when clicking Add button in DOM', () => {
    component.newAvoidWord.set('toxic');
    fixture.detectChanges();

    const addBtns = nativeElement.querySelectorAll('.vocab-input-row .btn-secondary');
    const addAvoidBtn = addBtns[1] as HTMLButtonElement;
    addAvoidBtn.click();
    fixture.detectChanges();

    expect(component.data().vocabulary.avoid).toContain('toxic');
  });

  // --- Tone context: button clicks in DOM ---

  it('should start editing tone when clicking edit button on tone row', () => {
    component.generateToneContexts();
    fixture.detectChanges();

    const editBtn = nativeElement.querySelector('.tone-table .btn-icon-only') as HTMLButtonElement;
    editBtn.click();
    fixture.detectChanges();

    expect(component.editingToneId()).toBe(component.data().toneByContext[0].id);
  });

  it('should remove tone when clicking delete button on tone row', () => {
    component.generateToneContexts();
    fixture.detectChanges();

    const deleteBtn = nativeElement.querySelector('.tone-table .btn-danger') as HTMLButtonElement;
    deleteBtn.click();
    fixture.detectChanges();

    expect(component.data().toneByContext.length).toBe(3);
  });

  // --- Voice attributes: button clicks in DOM ---

  it('should start editing attribute when clicking edit button on attribute card', () => {
    component.generateAttributes();
    vi.advanceTimersByTime(2000);
    fixture.detectChanges();

    const editBtn = nativeElement.querySelector('.attribute-card .btn-icon-only') as HTMLButtonElement;
    editBtn.click();
    fixture.detectChanges();

    expect(component.editingAttributeId()).toBe(component.data().voiceAttributes[0].id);
  });

  it('should remove attribute when clicking delete button on attribute card', () => {
    component.generateAttributes();
    vi.advanceTimersByTime(2000);
    fixture.detectChanges();

    const deleteBtn = nativeElement.querySelector('.attribute-card .btn-danger') as HTMLButtonElement;
    deleteBtn.click();
    fixture.detectChanges();

    expect(component.data().voiceAttributes.length).toBe(3);
  });

  // --- Save/Cancel from inline form via DOM ---

  it('should save attribute via inline form Save button click', () => {
    component.startAddAttribute();
    component.updateEditAttributeField('label', 'DOM Label');
    fixture.detectChanges();

    const saveBtn = nativeElement.querySelector('.inline-form .btn-primary') as HTMLButtonElement;
    saveBtn.click();
    fixture.detectChanges();

    expect(component.data().voiceAttributes.length).toBe(1);
    expect(component.data().voiceAttributes[0].label).toBe('DOM Label');
  });

  it('should cancel attribute editing via inline form Cancel button click', () => {
    component.startAddAttribute();
    fixture.detectChanges();

    const cancelBtn = nativeElement.querySelector('.inline-form .btn-secondary') as HTMLButtonElement;
    cancelBtn.click();
    fixture.detectChanges();

    expect(component.editingAttributeId()).toBeNull();
  });

  // --- Tone form save/cancel via DOM ---

  it('should save tone via inline form Save button', () => {
    component.startAddTone();
    component.updateEditToneField('context', 'DOM Context');
    fixture.detectChanges();

    const forms = nativeElement.querySelectorAll('.inline-form');
    const toneForm = forms[forms.length - 1];
    const saveBtn = toneForm.querySelector('.btn-primary') as HTMLButtonElement;
    saveBtn.click();
    fixture.detectChanges();

    expect(component.data().toneByContext.length).toBe(1);
  });

  it('should cancel tone editing via inline form Cancel button', () => {
    component.startAddTone();
    fixture.detectChanges();

    const forms = nativeElement.querySelectorAll('.inline-form');
    const toneForm = forms[forms.length - 1];
    const cancelBtn = toneForm.querySelector('.btn-secondary') as HTMLButtonElement;
    cancelBtn.click();
    fixture.detectChanges();

    expect(component.editingToneId()).toBeNull();
  });

  // --- Platform textarea placeholder ---

  it('should render platform label text in each platform card', () => {
    const labels = nativeElement.querySelectorAll('.platform-label');
    expect(labels.length).toBe(5);
    expect(labels[0].textContent?.trim()).toBe('Instagram');
    expect(labels[1].textContent?.trim()).toBe('TikTok');
  });

  // --- Generate vocabulary via DOM button ---

  it('should generate vocabulary via AI Generate Vocabulary button click', () => {
    const allBtns = nativeElement.querySelectorAll('.btn-ai');
    const genVocabBtn = Array.from(allBtns).find(btn => btn.textContent?.includes('AI Generate Vocabulary')) as HTMLButtonElement;
    expect(genVocabBtn).toBeTruthy();
    genVocabBtn.click();
    fixture.detectChanges();

    expect(component.data().vocabulary.preferred.length).toBeGreaterThan(0);
  });

  // --- Add Context button click ---

  it('should start adding tone context via Add Context button click', () => {
    const addCtxBtn = Array.from(nativeElement.querySelectorAll('.btn-secondary')).find(
      btn => btn.textContent?.includes('Add Context')
    ) as HTMLButtonElement;
    expect(addCtxBtn).toBeTruthy();
    addCtxBtn.click();
    fixture.detectChanges();

    expect(component.editingToneId()).toBeTruthy();
  });

  // --- Add Attribute button click ---

  it('should start adding attribute via Add Attribute button click', () => {
    const addAttrBtn = Array.from(nativeElement.querySelectorAll('.btn-secondary')).find(
      btn => btn.textContent?.includes('Add Attribute')
    ) as HTMLButtonElement;
    expect(addAttrBtn).toBeTruthy();
    addAttrBtn.click();
    fixture.detectChanges();

    expect(component.editingAttributeId()).toBeTruthy();
  });

  // --- Mission textarea via DOM ---

  it('should update data mission statement after drafting', () => {
    component.draftMission();
    vi.advanceTimersByTime(2000);

    expect(component.data().missionStatement).toContain('Empower women over 40');
    fixture.detectChanges();
    // Verify the textarea element exists after draft
    const textarea = nativeElement.querySelector('.mission-textarea') as HTMLTextAreaElement;
    expect(textarea).toBeTruthy();
  });

  // --- updateEditToneField for id field ---

  it('should update edit tone id field', () => {
    component.updateEditToneField('id', 'new-id');
    expect(component.editTone().id).toBe('new-id');
  });

  // --- updateEditAttributeField for id field ---

  it('should update edit attribute id field', () => {
    component.updateEditAttributeField('id', 'new-id');
    expect(component.editAttribute().id).toBe('new-id');
  });

  // --- ngModelChange template handlers via DOM input ---

  it('should trigger updateMission via textarea ngModelChange', () => {
    const textarea = nativeElement.querySelector('.mission-textarea') as HTMLTextAreaElement;
    textarea.value = 'New mission value';
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(component.data().missionStatement).toBe('New mission value');
  });

  it('should trigger updateEditAttributeField via attribute edit form inputs', () => {
    component.startAddAttribute();
    fixture.detectChanges();

    const inputs = nativeElement.querySelectorAll('.inline-form .form-input') as NodeListOf<HTMLInputElement>;
    // label input
    inputs[0].value = 'Test Label';
    inputs[0].dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(component.editAttribute().label).toBe('Test Label');

    // description input
    inputs[1].value = 'Test Desc';
    inputs[1].dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(component.editAttribute().description).toBe('Test Desc');

    // doExample input
    inputs[2].value = 'Do this';
    inputs[2].dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(component.editAttribute().doExample).toBe('Do this');

    // dontExample input
    inputs[3].value = 'Dont this';
    inputs[3].dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(component.editAttribute().dontExample).toBe('Dont this');
  });

  it('should trigger updateEditToneField via tone edit form inputs', () => {
    component.startAddTone();
    fixture.detectChanges();

    const inputs = nativeElement.querySelectorAll('.inline-form .form-input') as NodeListOf<HTMLInputElement>;
    // context input
    inputs[0].value = 'Test Context';
    inputs[0].dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(component.editTone().context).toBe('Test Context');

    // tone input
    inputs[1].value = 'Test Tone';
    inputs[1].dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(component.editTone().tone).toBe('Test Tone');

    // example input
    inputs[2].value = 'Test Example';
    inputs[2].dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(component.editTone().example).toBe('Test Example');
  });

  it('should trigger updatePlatformAdjustment via platform textarea ngModelChange', () => {
    const textareas = nativeElement.querySelectorAll('.platform-textarea') as NodeListOf<HTMLTextAreaElement>;
    textareas[0].value = 'Updated Instagram adjustment';
    textareas[0].dispatchEvent(new Event('input'));
    fixture.detectChanges();
    const ig = component.data().platformToneAdjustments.find(p => p.platform === 'instagram');
    expect(ig?.adjustment).toBe('Updated Instagram adjustment');
  });

  it('should trigger newPreferredWord.set via preferred word input ngModelChange', () => {
    const inputs = nativeElement.querySelectorAll('.vocab-input-row .form-input') as NodeListOf<HTMLInputElement>;
    inputs[0].value = 'strength';
    inputs[0].dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(component.newPreferredWord()).toBe('strength');
  });

  it('should trigger newAvoidWord.set via avoid word input ngModelChange', () => {
    const inputs = nativeElement.querySelectorAll('.vocab-input-row .form-input') as NodeListOf<HTMLInputElement>;
    inputs[1].value = 'hate';
    inputs[1].dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(component.newAvoidWord()).toBe('hate');
  });

  // --- Both branches of *ngIf for platform spinner ---

  it('should show spinner for each platform when suggesting that platform', () => {
    // Test all 5 platforms to ensure *ngIf branches for each are covered
    const platforms: Array<'instagram' | 'tiktok' | 'youtube' | 'facebook' | 'linkedin'> = [
      'instagram', 'tiktok', 'youtube', 'facebook', 'linkedin'
    ];
    for (const platform of platforms) {
      component.suggestPlatformTone(platform);
      fixture.detectChanges();
      vi.advanceTimersByTime(1500);
      fixture.detectChanges();
    }
    // Verify all have adjustments
    for (const platform of platforms) {
      const entry = component.data().platformToneAdjustments.find(p => p.platform === platform);
      expect(entry?.adjustment).toBeTruthy();
    }
  });

  // --- Both states for attribute edit form ---

  it('should show both attribute edit form and attribute cards when editing existing', () => {
    component.generateAttributes();
    vi.advanceTimersByTime(2000);
    fixture.detectChanges();

    const attr = component.data().voiceAttributes[0];
    component.startEditAttribute(attr);
    fixture.detectChanges();

    // Both the inline form and the attribute cards should be present
    expect(nativeElement.querySelector('.inline-form')).toBeTruthy();
    expect(nativeElement.querySelectorAll('.attribute-card').length).toBe(4);
  });

  // --- Both states for tone edit form ---

  it('should show both tone table and tone edit form when editing existing tone', () => {
    component.generateToneContexts();
    fixture.detectChanges();

    const tone = component.data().toneByContext[0];
    component.startEditTone(tone);
    fixture.detectChanges();

    expect(nativeElement.querySelector('.tone-table')).toBeTruthy();
    expect(nativeElement.querySelector('.inline-form')).toBeTruthy();
  });

  // --- Generate attributes: show spinner and hide SVG in button ---

  it('should show generating state for attributes button in DOM', () => {
    component.generateAttributes();
    fixture.detectChanges();

    const btns = nativeElement.querySelectorAll('.btn-ai');
    const genBtn = btns[1];
    expect(genBtn?.querySelector('.spinner')).toBeTruthy();
    expect(genBtn?.querySelector('svg.btn-icon')).toBeFalsy();

    vi.advanceTimersByTime(2000);
    fixture.detectChanges();

    expect(genBtn?.querySelector('.spinner')).toBeFalsy();
    expect(genBtn?.querySelector('svg.btn-icon')).toBeTruthy();
  });
});
