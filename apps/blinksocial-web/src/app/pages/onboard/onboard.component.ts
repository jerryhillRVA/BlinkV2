import {
  Component,
  inject,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewChecked,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { OnboardStateService } from './onboard-state.service';
import { ChatMessageComponent } from './chat-message/chat-message.component';
import { SectionProgressComponent } from './section-progress/section-progress.component';
import { BlueprintPreviewComponent } from './blueprint-preview/blueprint-preview.component';

@Component({
  selector: 'app-onboard',
  imports: [
    CommonModule,
    FormsModule,
    ChatMessageComponent,
    SectionProgressComponent,
    BlueprintPreviewComponent,
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

  userInput = '';
  workspaceName = signal('');
  sessionStarted = signal(false);
  private shouldScrollToBottom = false;

  ngOnInit(): void {
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

  onSendMessage(): void {
    const content = this.userInput.trim();
    if (!content || this.state.isLoading()) return;

    this.userInput = '';
    this.shouldScrollToBottom = true;
    this.state.sendMessage(content);
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
}
