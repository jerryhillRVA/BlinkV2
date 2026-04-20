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
import { PlatformIconComponent } from '../../../../../shared/platform-icon/platform-icon.component';
import { InlineEditComponent } from '../../../../../shared/inline-edit/inline-edit.component';
import {
  PLATFORM_OPTIONS,
  PLATFORM_CONTENT_TYPES,
} from '../../../content.constants';
import type { ContentItem } from '../../../content.types';

@Component({
  selector: 'app-concept-detail-header',
  imports: [PlatformIconComponent, InlineEditComponent],
  templateUrl: './concept-detail-header.component.html',
  styleUrl: './concept-detail-header.component.scss',
})
export class ConceptDetailHeaderComponent {
  private readonly elRef = inject(ElementRef);

  @Input({ required: true }) item!: ContentItem;
  @Input() canMoveToProduction = false;

  @Output() back = new EventEmitter<void>();
  @Output() moveToProduction = new EventEmitter<void>();
  @Output() demoteToIdea = new EventEmitter<void>();
  @Output() deleteConcept = new EventEmitter<void>();
  @Output() titleChange = new EventEmitter<string>();

  protected readonly menuOpen = signal(false);

  protected platformLabel(): string | null {
    const p = this.item.platform;
    if (!p) return null;
    return PLATFORM_OPTIONS.find((o) => o.value === p)?.label ?? null;
  }

  protected contentTypeLabel(): string | null {
    const p = this.item.platform;
    const ct = this.item.contentType;
    if (!p || !ct) return null;
    return (
      PLATFORM_CONTENT_TYPES[p].find((o) => o.value === ct)?.label ?? null
    );
  }

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

  protected onBack(): void {
    this.back.emit();
  }

  protected onMoveToProduction(): void {
    if (!this.canMoveToProduction) return;
    this.moveToProduction.emit();
  }

  protected onTitleChange(v: string): void {
    this.titleChange.emit(v);
  }

  protected onDemote(): void {
    this.closeMenu();
    this.demoteToIdea.emit();
  }

  protected onDelete(): void {
    this.closeMenu();
    this.deleteConcept.emit();
  }
}
