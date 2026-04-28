import {
  Component,
  inject,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewChecked,
  HostListener,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { OnboardStateService } from './onboard-state.service';
import { ChatMessageComponent } from './chat-message/chat-message.component';
import { SectionProgressComponent } from './section-progress/section-progress.component';
import { BlueprintPreviewComponent } from './blueprint-preview/blueprint-preview.component';
import { ComposerAttachmentChipComponent } from './composer-attachment-chip/composer-attachment-chip.component';

/** Per-file size cap, mirrored on the API side. */
const MAX_FILE_BYTES = 10 * 1024 * 1024;
/** Form-total cap; rejects new uploads once exceeded. */
const MAX_FORM_BYTES = 25 * 1024 * 1024;
/** Accepted MIME prefixes / extensions, mirrored on the API side. */
const ACCEPT_ATTRIBUTE =
  'image/*,application/pdf,text/*,.doc,.docx,.md,.csv,.rtf';
const ALLOWED_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.pdf',
  '.txt',
  '.md',
  '.csv',
  '.rtf',
  '.doc',
  '.docx',
]);

interface PendingAttachment {
  /** Stable client-side identifier so trackBy / remove works without mutation. */
  localId: string;
  file: File;
  /** When set, the chip renders in error state and is excluded from upload. */
  error?: string;
}

@Component({
  selector: 'app-onboard',
  imports: [
    CommonModule,
    FormsModule,
    ChatMessageComponent,
    SectionProgressComponent,
    BlueprintPreviewComponent,
    ComposerAttachmentChipComponent,
  ],
  providers: [OnboardStateService],
  templateUrl: './onboard.component.html',
  styleUrl: './onboard.component.scss',
})
export class OnboardComponent implements OnInit, AfterViewChecked {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly state = inject(OnboardStateService);

  @ViewChild('messageList') private messageListRef!: ElementRef<HTMLDivElement>;
  @ViewChild('fileInput') private fileInputRef!: ElementRef<HTMLInputElement>;

  /** Exposed to template for the hidden `<input>`'s `accept` attribute. */
  protected readonly acceptAttribute = ACCEPT_ATTRIBUTE;

  userInput = '';
  workspaceName = signal('');
  sessionStarted = signal(false);
  /** Chips rendered above the textarea before send. */
  protected readonly pendingAttachments = signal<PendingAttachment[]>([]);
  /** Drives the dashed-border drop overlay. Desktop only. */
  protected readonly isDragging = signal(false);
  /** Detect coarse pointers (touch) so we never wire drag listeners. */
  protected readonly isTouchDevice = signal(false);
  private dragDepth = 0;
  private shouldScrollToBottom = false;

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      this.isTouchDevice.set(window.matchMedia?.('(pointer: coarse)').matches ?? false);
    }
    const resumeWorkspace = this.route.snapshot.queryParamMap.get('workspace');
    if (resumeWorkspace) {
      this.sessionStarted.set(true);
      this.state.resumeSession(resumeWorkspace);
    }
  }

  onStartSession(): void {
    const name = this.workspaceName().trim();
    if (!name) return;
    this.sessionStarted.set(true);
    this.state.startSession(name);
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  protected get hasSendableContent(): boolean {
    if (this.state.isLoading()) return false;
    const hasText = this.userInput.trim().length > 0;
    const hasFiles = this.pendingAttachments().some((p) => !p.error);
    return hasText || hasFiles;
  }

  /** Open the hidden file input. */
  onAttachClick(): void {
    if (this.state.isLoading()) return;
    this.fileInputRef?.nativeElement.click();
  }

  onFilePicked(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.addFiles(Array.from(input.files));
    }
    // Allow the same file to be re-selected later.
    input.value = '';
  }

  onRemoveAttachment(localId: string): void {
    this.pendingAttachments.update((list) => list.filter((p) => p.localId !== localId));
  }

  onSendMessage(): void {
    const text = this.userInput.trim();
    const valid = this.pendingAttachments().filter((p) => !p.error);
    if (!text && valid.length === 0) return;
    if (this.state.isLoading()) return;

    const files = valid.map((p) => p.file);
    this.userInput = '';
    this.pendingAttachments.set([]);
    this.shouldScrollToBottom = true;
    this.state.sendMessage(text, files);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSendMessage();
    }
  }

  onGenerateBlueprint(): void {
    this.state.generateBlueprint();
  }

  onDownloadBlueprint(): void {
    this.state.downloadBlueprint();
  }

  onCreateWorkspace(): void {
    this.state.createWorkspaceFromBlueprint();
  }

  onBackToDashboard(): void {
    this.router.navigate(['/']);
  }

  scrollToBottom(): void {
    if (this.messageListRef?.nativeElement) {
      const el = this.messageListRef.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }

  // ---------------------------------------------------------------------------
  // Drag-and-drop (desktop only — guarded by `isTouchDevice`)
  // ---------------------------------------------------------------------------

  @HostListener('dragenter', ['$event'])
  onDragEnter(event: DragEvent): void {
    if (this.isTouchDevice() || !this.eventCarriesFiles(event)) return;
    event.preventDefault();
    this.dragDepth += 1;
    this.isDragging.set(true);
  }

  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent): void {
    if (this.isTouchDevice() || !this.eventCarriesFiles(event)) return;
    event.preventDefault();
  }

  @HostListener('dragleave', ['$event'])
  onDragLeave(event: DragEvent): void {
    if (this.isTouchDevice() || !this.eventCarriesFiles(event)) return;
    event.preventDefault();
    this.dragDepth = Math.max(0, this.dragDepth - 1);
    if (this.dragDepth === 0) {
      this.isDragging.set(false);
    }
  }

  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent): void {
    if (this.isTouchDevice() || !this.eventCarriesFiles(event)) return;
    event.preventDefault();
    this.dragDepth = 0;
    this.isDragging.set(false);
    const files = Array.from(event.dataTransfer?.files ?? []);
    if (files.length > 0) {
      this.addFiles(files);
    }
  }

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  private addFiles(files: File[]): void {
    // Track the running total *within this batch* so that three consecutive
    // 9 MB picks correctly trip the 25 MB form ceiling on the third file.
    let runningTotal = this.pendingAttachments()
      .filter((p) => !p.error)
      .reduce((sum, p) => sum + p.file.size, 0);
    const additions: PendingAttachment[] = [];
    for (const file of files) {
      const error = this.validateFile(file, runningTotal);
      if (!error) {
        runningTotal += file.size;
      }
      additions.push({
        localId: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        file,
        error,
      });
    }
    this.pendingAttachments.update((list) => [...list, ...additions]);
  }

  private validateFile(file: File, currentTotal = 0): string | undefined {
    const ext = this.extensionOf(file.name);
    if (ext === '.doc' || file.type === 'application/msword') {
      return 'Legacy .doc not supported — save as .docx or .pdf';
    }
    const mimeOk =
      file.type.startsWith('image/') ||
      file.type.startsWith('text/') ||
      file.type === 'application/pdf' ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.type === 'application/rtf' ||
      file.type === 'text/rtf' ||
      file.type === 'text/markdown' ||
      file.type === 'text/csv';
    const extOk = ext !== '' && ALLOWED_EXTENSIONS.has(ext);
    if (!mimeOk && !extOk) {
      return 'Unsupported file type';
    }
    if (file.size > MAX_FILE_BYTES) {
      return 'File exceeds 10 MB limit';
    }
    if (currentTotal + file.size > MAX_FORM_BYTES) {
      return 'Total upload exceeds 25 MB';
    }
    return undefined;
  }

  private extensionOf(filename: string): string {
    const idx = filename.lastIndexOf('.');
    if (idx < 0) return '';
    return filename.slice(idx).toLowerCase();
  }

  private eventCarriesFiles(event: DragEvent): boolean {
    const types = event.dataTransfer?.types;
    if (!types) return false;
    for (let i = 0; i < types.length; i++) {
      if (types[i] === 'Files') return true;
    }
    return false;
  }
}
