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
  STAGE_BADGES,
  type StageBadge,
} from '../../../content.constants';
import type { ContentItem } from '../../../content.types';

@Component({
  selector: 'app-idea-detail-header',
  imports: [PlatformIconComponent, InlineEditComponent],
  templateUrl: './idea-detail-header.component.html',
  styleUrl: './idea-detail-header.component.scss',
})
export class IdeaDetailHeaderComponent {
  private readonly elRef = inject(ElementRef);

  @Input({ required: true }) item!: ContentItem;

  @Output() advance = new EventEmitter<void>();
  @Output() archive = new EventEmitter<void>();
  @Output() unarchive = new EventEmitter<void>();
  @Output() duplicate = new EventEmitter<void>();
  @Output() copyLink = new EventEmitter<void>();
  @Output() titleChange = new EventEmitter<string>();

  protected readonly menuOpen = signal(false);

  protected stageBadge(): StageBadge {
    return STAGE_BADGES[this.item.stage] ?? STAGE_BADGES.idea;
  }

  protected platformLabel(): string | null {
    const p = this.item.platform;
    if (!p) return null;
    return PLATFORM_OPTIONS.find((o) => o.value === p)?.label ?? null;
  }

  protected contentTypeLabel(): string | null {
    const p = this.item.platform;
    const ct = this.item.contentType;
    if (!p || !ct) return null;
    return PLATFORM_CONTENT_TYPES[p]?.find((o) => o.value === ct)?.label ?? null;
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

  protected onAdvance(): void {
    this.advance.emit();
  }

  protected onTitleChange(v: string): void {
    this.titleChange.emit(v);
  }

  protected onCopy(): void {
    this.closeMenu();
    this.copyLink.emit();
  }

  protected onArchive(): void {
    this.closeMenu();
    this.archive.emit();
  }

  protected onUnarchive(): void {
    this.closeMenu();
    this.unarchive.emit();
  }

  protected onDuplicate(): void {
    this.closeMenu();
    this.duplicate.emit();
  }
}
