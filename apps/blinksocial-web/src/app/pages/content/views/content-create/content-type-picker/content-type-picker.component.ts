import {
  Component,
  ElementRef,
  HostListener,
  EventEmitter,
  Output,
  inject,
  input,
} from '@angular/core';
import type { ContentItemType } from '../../../content.types';

interface PickerOption {
  type: ContentItemType;
  label: string;
  description: string;
  iconColor: string;
  iconPaths: string[];
}

const PICKER_OPTIONS: PickerOption[] = [
  {
    type: 'idea',
    label: 'Idea',
    description: 'A raw spark to develop later',
    iconColor: '#3b82f6',
    // Lucide Lightbulb
    iconPaths: [
      'M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5',
      'M9 18h6',
      'M10 22h4',
    ],
  },
  {
    type: 'concept',
    label: 'Concept',
    description: 'A defined angle with a hook',
    iconColor: '#a855f7',
    // Lucide Send
    iconPaths: [
      'M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z',
      'M21.854 2.147l-10.94 10.939',
    ],
  },
  {
    type: 'production-brief',
    label: 'Production Brief',
    description: 'Ready to produce now',
    iconColor: '#f97316',
    // Lucide FileText
    iconPaths: [
      'M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z',
      'M14 2v4a2 2 0 0 0 2 2h4',
      'M10 9H8',
      'M16 13H8',
      'M16 17H8',
    ],
  },
];

@Component({
  selector: 'app-content-type-picker',
  templateUrl: './content-type-picker.component.html',
  styleUrl: './content-type-picker.component.scss',
})
export class ContentTypePickerComponent {
  private readonly host = inject(ElementRef<HTMLElement>);
  /* v8 ignore next 1 — V8's function-call-throws branches on input()/signal() declarations are unreachable (Angular class-field init time; ESM exports not spy-able) */
  readonly open = input(false);

  @Output() selected = new EventEmitter<ContentItemType>();
  @Output() dismissed = new EventEmitter<void>();

  protected readonly options = PICKER_OPTIONS;

  protected onSelect(type: ContentItemType): void {
    this.selected.emit(type);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.open()) return;
    const target = event.target as Node | null;
    if (target && !this.host.nativeElement.contains(target)) {
      this.dismissed.emit();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (!this.open()) return;
    this.dismissed.emit();
  }
}
