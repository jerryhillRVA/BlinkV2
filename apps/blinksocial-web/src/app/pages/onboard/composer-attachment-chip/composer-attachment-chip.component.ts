import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { formatSize } from '@blinksocial/core';

/**
 * Read-only or interactive chip representing one attachment in the
 * composer (interactive — has `×` button) or in a chat-message bubble
 * (read-only — `removable=false`).
 */
@Component({
  selector: 'app-composer-attachment-chip',
  imports: [CommonModule],
  templateUrl: './composer-attachment-chip.component.html',
  styleUrl: './composer-attachment-chip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComposerAttachmentChipComponent {
  @Input({ required: true }) filename = '';
  @Input({ required: true }) sizeBytes = 0;
  @Input() error: string | null = null;
  @Input() removable = true;

  @Output() readonly remove = new EventEmitter<void>();

  protected get sizeLabel(): string {
    return formatSize(this.sizeBytes);
  }
}
