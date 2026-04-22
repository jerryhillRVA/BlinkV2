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
import { PLATFORM_OPTIONS, PLATFORM_CONTENT_TYPES } from '../../../content.constants';
import type { ContentItem, ContentStage } from '../../../content.types';

interface StageBadge {
  label: string;
  toneClass: string;
  iconPaths: string[];
}

const STAGE_BADGES: Record<ContentStage, StageBadge> = {
  idea: {
    label: 'Idea',
    toneClass: 'stage-idea',
    // Lucide Lightbulb
    iconPaths: [
      'M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5',
      'M9 18h6',
      'M10 22h4',
    ],
  },
  concept: {
    label: 'Concept',
    toneClass: 'stage-concept',
    // Lucide PenTool
    iconPaths: [
      'M15.707 21.293a1 1 0 0 1-1.414 0l-1.586-1.586a1 1 0 0 1 0-1.414l5.586-5.586a1 1 0 0 1 1.414 0l1.586 1.586a1 1 0 0 1 0 1.414z',
      'M18 13l-1.375-6.874a1 1 0 0 0-.746-.776L3.235 2.028a1 1 0 0 0-1.207 1.207L5.35 15.879a1 1 0 0 0 .776.746L13 18',
      'M2.3 2.3l7.286 7.286',
      'M11 11a2 2 0 1 1-4 0 2 2 0 0 1 4 0z',
    ],
  },
  post: {
    label: 'Post',
    toneClass: 'stage-post',
    // Lucide Send
    iconPaths: [
      'M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z',
      'M21.854 2.147l-10.94 10.939',
    ],
  },
};

@Component({
  selector: 'app-idea-detail-header',
  imports: [PlatformIconComponent, InlineEditComponent],
  templateUrl: './idea-detail-header.component.html',
  styleUrl: './idea-detail-header.component.scss',
})
export class IdeaDetailHeaderComponent {
  private readonly elRef = inject(ElementRef);

  @Input({ required: true }) item!: ContentItem;

  @Output() back = new EventEmitter<void>();
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

  protected onBack(): void {
    this.back.emit();
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
