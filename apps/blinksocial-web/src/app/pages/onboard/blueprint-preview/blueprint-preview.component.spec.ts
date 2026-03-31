import { TestBed } from '@angular/core/testing';
import { BlueprintPreviewComponent } from './blueprint-preview.component';
import { Component } from '@angular/core';

@Component({
  imports: [BlueprintPreviewComponent],
  template: `<app-blueprint-preview
    [markdownContent]="md"
    [isCreating]="isCreating"
    (download)="downloaded = true"
    (createWorkspace)="workspaceCreated = true" />`,
})
class TestHostComponent {
  md = '# Test Blueprint\n\nSome content here.';
  downloaded = false;
  workspaceCreated = false;
  isCreating = false;
}

describe('BlueprintPreviewComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();
  });

  it('should render markdown as HTML', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const rendered = fixture.nativeElement.querySelector('.markdown-rendered');
    expect(rendered).toBeTruthy();
    // Should render markdown h1 as an actual <h1> element
    const h1 = rendered.querySelector('h1');
    expect(h1).toBeTruthy();
    expect(h1.textContent).toContain('Test Blueprint');
    // Should render the paragraph
    const p = rendered.querySelector('p');
    expect(p).toBeTruthy();
    expect(p.textContent).toContain('Some content here');
  });

  it('should emit download event on button click', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('.download-btn');
    btn.click();
    expect(fixture.componentInstance.downloaded).toBe(true);
  });

  it('should show download button text', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('.download-btn');
    expect(btn.textContent).toContain('Download Markdown');
  });

  it('should show the blueprint title', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const title = fixture.nativeElement.querySelector('.preview-title h3');
    expect(title.textContent).toContain('Your Blink Blueprint');
  });

  it('should show create workspace button', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('.create-workspace-btn');
    expect(btn).toBeTruthy();
    expect(btn.textContent).toContain('Create Workspace from Blueprint');
  });

  it('should emit createWorkspace event on button click', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('.create-workspace-btn');
    btn.click();
    expect(fixture.componentInstance.workspaceCreated).toBe(true);
  });

  it('should disable create workspace button when isCreating is true', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.isCreating = true;
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('.create-workspace-btn') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(btn.textContent).toContain('Creating...');
  });
});
