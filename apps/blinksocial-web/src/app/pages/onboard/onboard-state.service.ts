import { Injectable, inject, signal, computed } from '@angular/core';
import { OnboardApiService } from './onboard-api.service';
import type {
  OnboardingMessageContract,
  DiscoverySectionContract,
  DiscoverySectionId,
  BlueprintDocumentContract,
  OnboardingSessionStatus,
} from '@blinksocial/contracts';

@Injectable()
export class OnboardStateService {
  private readonly api = inject(OnboardApiService);

  readonly sessionId = signal<string | null>(null);
  readonly status = signal<OnboardingSessionStatus>('active');
  readonly messages = signal<OnboardingMessageContract[]>([]);
  readonly sections = signal<DiscoverySectionContract[]>([]);
  readonly currentSection = signal<DiscoverySectionId>('business');
  readonly readyToGenerate = signal(false);
  readonly isLoading = signal(false);
  readonly blueprint = signal<BlueprintDocumentContract | null>(null);
  readonly markdownDocument = signal<string | null>(null);
  readonly error = signal<string | null>(null);

  readonly completedSections = computed(() =>
    this.sections().filter((s) => s.covered).length,
  );
  readonly totalSections = computed(() => this.sections().length);

  startSession(businessName?: string): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.api.createSession(businessName ? { businessName } : undefined).subscribe({
      next: (res) => {
        this.sessionId.set(res.sessionId);
        this.sections.set(res.sections);
        const now = new Date().toISOString();
        this.messages.set([
          { role: 'assistant', content: res.initialMessage, timestamp: now },
        ]);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(
          err?.error?.message ?? 'Failed to start onboarding session',
        );
        this.isLoading.set(false);
      },
    });
  }

  sendMessage(content: string): void {
    const sid = this.sessionId();
    if (!sid) return;

    const now = new Date().toISOString();
    this.messages.update((msgs) => [
      ...msgs,
      { role: 'user', content, timestamp: now },
    ]);
    this.isLoading.set(true);
    this.error.set(null);

    this.api.sendMessage(sid, content).subscribe({
      next: (res) => {
        this.messages.update((msgs) => [
          ...msgs,
          {
            role: 'assistant',
            content: res.agentMessage,
            timestamp: new Date().toISOString(),
          },
        ]);
        this.sections.set(res.sections);
        this.currentSection.set(res.currentSection);
        this.readyToGenerate.set(res.readyToGenerate);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Failed to send message');
        this.isLoading.set(false);
      },
    });
  }

  generateBlueprint(): void {
    const sid = this.sessionId();
    if (!sid) return;

    this.isLoading.set(true);
    this.status.set('generating');
    this.error.set(null);

    this.api.generateBlueprint(sid).subscribe({
      next: (res) => {
        this.blueprint.set(res.blueprint);
        this.markdownDocument.set(res.markdownDocument);
        this.status.set('complete');
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(
          err?.error?.message ?? 'Failed to generate blueprint',
        );
        this.status.set('active');
        this.isLoading.set(false);
      },
    });
  }

  downloadBlueprint(): void {
    const md = this.markdownDocument();
    const name = this.blueprint()?.clientName ?? 'blueprint';
    if (!md) return;

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blink-blueprint-${name.toLowerCase().replace(/\s+/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
