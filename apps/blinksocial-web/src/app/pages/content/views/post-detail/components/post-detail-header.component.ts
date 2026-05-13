import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  inject,
  signal,
} from '@angular/core';
import { InlineEditComponent } from '../../../../../shared/inline-edit/inline-edit.component';
import type { ContentItem } from '../../../content.types';

@Component({
  selector: 'app-post-detail-header',
  imports: [InlineEditComponent],
  templateUrl: './post-detail-header.component.html',
  styleUrl: './post-detail-header.component.scss',
})
export class PostDetailHeaderComponent {
  private readonly elRef = inject(ElementRef);

  @Input({ required: true }) item!: ContentItem;
  @Input() briefApproved = false;

  @Output() titleChange = new EventEmitter<string>();
  @Output() backToConcept = new EventEmitter<void>();
  @Output() archive = new EventEmitter<void>();
  @Output() unarchive = new EventEmitter<void>();
  /* v8 ignore next 1 — V8's function-call-throws branches on input()/signal() declarations are unreachable (Angular class-field init time; ESM exports not spy-able) */
  protected readonly menuOpen = signal(false);

  protected toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.closeMenu();
    }
  }

  protected onTitleChange(v: string): void {
    this.titleChange.emit(v);
  }

  protected onBackToConcept(): void {
    this.closeMenu();
    this.backToConcept.emit();
  }

  protected onArchive(): void {
    this.closeMenu();
    this.archive.emit();
  }

  protected onUnarchive(): void {
    this.closeMenu();
    this.unarchive.emit();
  }
}
