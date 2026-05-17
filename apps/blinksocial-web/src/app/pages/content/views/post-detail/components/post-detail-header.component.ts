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
import { IconComponent } from '../../../../../shared/icons/icon.component';
import { InlineEditComponent } from '../../../../../shared/inline-edit/inline-edit.component';
import type { ContentItem } from '../../../content.types';

/** #146: header variant — drives badge + menu items per pipeline column. */
export type PostDetailHeaderVariant = 'production' | 'scheduled' | 'published';

@Component({
  selector: 'app-post-detail-header',
  imports: [IconComponent, InlineEditComponent],
  templateUrl: './post-detail-header.component.html',
  styleUrl: './post-detail-header.component.scss',
})
export class PostDetailHeaderComponent {
  private readonly elRef = inject(ElementRef);

  @Input({ required: true }) item!: ContentItem;
  @Input() briefApproved = false;
  /** #146: 'production' (default) preserves existing behavior. */
  @Input() variant: PostDetailHeaderVariant = 'production';

  @Output() titleChange = new EventEmitter<string>();
  @Output() backToConcept = new EventEmitter<void>();
  @Output() archive = new EventEmitter<void>();
  @Output() unarchive = new EventEmitter<void>();
  /** #146: 3-dot menu actions emitted by terminal-state shells. */
  @Output() edit = new EventEmitter<void>();
  @Output() downloadExport = new EventEmitter<void>();
  @Output() viewLivePost = new EventEmitter<void>();
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

  protected onEdit(): void {
    this.closeMenu();
    this.edit.emit();
  }

  protected onDownloadExport(): void {
    this.closeMenu();
    this.downloadExport.emit();
  }

  protected onViewLivePost(): void {
    this.closeMenu();
    this.viewLivePost.emit();
  }
}
