import {
  Component,
  EventEmitter,
  Input,
  Output,
  signal,
} from '@angular/core';

@Component({
  selector: 'app-asset-uploader',
  templateUrl: './asset-uploader.component.html',
  styleUrl: './asset-uploader.component.scss',
})
export class AssetUploaderComponent {
  @Input() label = 'Upload image';
  @Input() accept = 'image/*';
  @Input() filename: string | undefined;
  @Input() disabled = false;

  @Output() fileChange = new EventEmitter<{ name: string; size: number } | null>();
  @Output() aiGenerate = new EventEmitter<void>();

  protected readonly busy = signal(false);

  protected onFileChange(e: Event): void {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      this.fileChange.emit(null);
      return;
    }
    this.fileChange.emit({ name: file.name, size: file.size });
  }

  protected onRemove(): void {
    this.fileChange.emit(null);
  }

  protected onAiGenerate(): void {
    if (this.disabled) return;
    this.aiGenerate.emit();
  }
}
