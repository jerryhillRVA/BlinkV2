import { Component, input, output, computed } from '@angular/core';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import { inject } from '@angular/core';
import { marked } from 'marked';

@Component({
  selector: 'app-blueprint-preview',
  templateUrl: './blueprint-preview.component.html',
  styleUrl: './blueprint-preview.component.scss',
})
export class BlueprintPreviewComponent {
  private readonly sanitizer = inject(DomSanitizer);

  markdownContent = input.required<string>();
  clientName = input<string>('');
  isCreating = input<boolean>(false);
  /**
   * Set by the parent while a Blueprint regeneration is in flight (revision
   * round) so we can disable Create Workspace and avoid a race between the
   * still-rendering prior blueprint and the in-flight new one.
   */
  isGenerating = input<boolean>(false);
  download = output<void>();
  createWorkspace = output<void>();

  renderedHtml = computed<SafeHtml>(() => {
    const html = marked.parse(this.markdownContent(), { async: false }) as string;
    return this.sanitizer.bypassSecurityTrustHtml(html);
  });

  onDownload(): void {
    this.download.emit();
  }

  onCreateWorkspace(): void {
    this.createWorkspace.emit();
  }
}
