import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MoveToProductionDialogComponent } from './move-to-production-dialog.component';
import type { TargetPlatform } from '../concept-detail.types';

const TARGETS: TargetPlatform[] = [
  { platform: 'instagram', contentType: 'reel' },
  { platform: 'tiktok', contentType: 'short-video' },
];

function setup(
  title = 'A concept',
  targets: TargetPlatform[] = TARGETS,
): ComponentFixture<MoveToProductionDialogComponent> {
  TestBed.configureTestingModule({ imports: [MoveToProductionDialogComponent] });
  const fixture = TestBed.createComponent(MoveToProductionDialogComponent);
  fixture.componentRef.setInput('title', title);
  fixture.componentRef.setInput('targets', targets);
  fixture.detectChanges();
  return fixture;
}

describe('MoveToProductionDialogComponent', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    document.body.style.overflow = '';
  });

  it('teleports the dialog into document.body and locks scroll', () => {
    const fixture = setup();
    expect(document.body.querySelector('.move-dialog')).not.toBeNull();
    expect(document.body.style.overflow).toBe('hidden');
    fixture.destroy();
    expect(document.body.style.overflow).toBe('');
  });

  it('renders the title and target count in the header', () => {
    const fixture = setup('Breathwork series');
    const title = document.body.querySelector('#move-dialog-title') as HTMLElement;
    const desc = document.body.querySelector('.modal-description') as HTMLElement;
    expect(title.textContent).toContain('Breathwork series');
    expect(desc.textContent).toContain('2 production targets selected');
    fixture.destroy();
  });

  it('pluralizes "target" correctly for a single target', () => {
    const fixture = setup('Single', [TARGETS[0]]);
    const desc = document.body.querySelector('.modal-description') as HTMLElement;
    expect(desc.textContent).toContain('1 production target selected');
    fixture.destroy();
  });

  it('renders one target li per target with human labels', () => {
    const fixture = setup();
    const lis = Array.from(
      document.body.querySelectorAll('.move-dialog-target') as NodeListOf<HTMLElement>,
    ).map((el) => el.textContent?.trim());
    expect(lis).toEqual(['Instagram Reel', 'TikTok Short Video']);
    fixture.destroy();
  });

  it('primary + per-target workOn buttons emit correctly', () => {
    const fixture = setup();
    const selectAll: number[] = [];
    const workOn: number[] = [];
    fixture.componentInstance.selectAll.subscribe(() => selectAll.push(1));
    fixture.componentInstance.workOn.subscribe((i) => workOn.push(i));

    (document.body.querySelector('.btn-primary') as HTMLButtonElement).click();
    const workButtons = document.body.querySelectorAll(
      '.btn-workon',
    ) as NodeListOf<HTMLButtonElement>;
    workButtons[1].click();

    expect(selectAll.length).toBe(1);
    expect(workOn).toEqual([1]);
    fixture.destroy();
  });

  it('does not render a "Keep Concept Card" secondary button', () => {
    const fixture = setup();
    expect(document.body.querySelector('.btn-secondary')).toBeNull();
    fixture.destroy();
  });

  it('close button + escape fire cancelDialog', () => {
    const fixture = setup();
    let cancelled = 0;
    fixture.componentInstance.cancelDialog.subscribe(() => cancelled++);
    (document.body.querySelector('.modal-close') as HTMLButtonElement).click();
    (fixture.componentInstance as unknown as { onEscape: () => void }).onEscape();
    expect(cancelled).toBe(2);
    fixture.destroy();
  });

  it('backdrop click emits cancelDialog; inner click does NOT', () => {
    const fixture = setup();
    let cancelled = 0;
    fixture.componentInstance.cancelDialog.subscribe(() => cancelled++);
    const overlay = document.body.querySelector('.move-dialog-overlay') as HTMLElement;
    (fixture.componentInstance as unknown as { onBackdropClick: (e: MouseEvent) => void }).onBackdropClick(
      { target: overlay, currentTarget: overlay } as unknown as MouseEvent,
    );
    expect(cancelled).toBe(1);
    const dialog = document.body.querySelector('.move-dialog') as HTMLElement;
    (fixture.componentInstance as unknown as { onBackdropClick: (e: MouseEvent) => void }).onBackdropClick(
      { target: dialog, currentTarget: overlay } as unknown as MouseEvent,
    );
    expect(cancelled).toBe(1); // no change
    fixture.destroy();
  });

  it('stopEvent calls event.stopPropagation', () => {
    const fixture = setup();
    const evt = { stopPropagation: vi.fn() };
    (fixture.componentInstance as unknown as { stopEvent: (e: Event) => void }).stopEvent(
      evt as unknown as Event,
    );
    expect(evt.stopPropagation).toHaveBeenCalled();
    fixture.destroy();
  });

  it('targetLabel falls back to raw values when platform/contentType are unknown', () => {
    const fixture = setup('x', [
      { platform: 'mystery-platform' as never, contentType: 'mystery-type' as never },
    ]);
    const label = document.body.querySelector('.move-dialog-target')?.textContent?.trim();
    expect(label).toContain('mystery-platform');
    expect(label).toContain('mystery-type');
    fixture.destroy();
  });
});
