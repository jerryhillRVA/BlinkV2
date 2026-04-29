import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { OnboardApiService } from './onboard-api.service';
import type {
  OnboardingMessageContract,
  OnboardingAttachmentContract,
  DiscoverySectionContract,
  DiscoverySectionId,
  BlueprintDocumentContract,
  OnboardingSessionStatus,
} from '@blinksocial/contracts';

/**
 * Canned assistant message appended client-side every time the Blueprint
 * finishes generating (initial generation OR post-revision regeneration).
 * Surfacing this prompt locally keeps it out of the LLM call and guarantees
 * the user always sees a clear fork-in-the-road after each generation.
 */
const POST_GENERATION_PROMPT =
  'Your Blueprint is ready. Would you like to request revisions, or proceed to Create Workspace?';

@Injectable()
export class OnboardStateService {
  private readonly api = inject(OnboardApiService);
  private readonly router = inject(Router);

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

  readonly isCreatingWorkspace = signal(false);
  /**
   * Increments every time the canned post-generation prompt is appended,
   * giving the component a one-shot signal to move keyboard focus to the
   * chat textarea. Components react via `effect()`.
   */
  readonly postGenerationPromptCount = signal(0);

  readonly completedSections = computed(() =>
    this.sections().filter((s) => s.covered).length,
  );
  readonly totalSections = computed(() => this.sections().length);

  startSession(workspaceName: string, businessName?: string): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.api.createSession({ workspaceName, businessName }).subscribe({
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

  sendMessage(content: string, files: File[] = []): void {
    const sid = this.sessionId();
    if (!sid) return;

    const now = new Date().toISOString();
    const msgsBefore = this.messages();
    // Build optimistic attachment records so the user immediately sees their
    // chips inside the freshly-sent bubble. Server-assigned ids/fileIds
    // overwrite these in `next` once the response arrives.
    const optimisticAttachments: OnboardingAttachmentContract[] = files.map((f) => ({
      id: `pending-${Math.random().toString(36).slice(2, 10)}`,
      filename: f.name,
      mimeType: f.type,
      sizeBytes: f.size,
      fileId: '',
      kind: f.type.startsWith('image/')
        ? 'image'
        : f.type === 'application/pdf'
        ? 'pdf'
        : f.type.startsWith('text/')
        ? 'text'
        : 'document',
    }));

    this.messages.update((msgs) => [
      ...msgs,
      {
        role: 'user',
        content,
        timestamp: now,
        ...(optimisticAttachments.length > 0
          ? { attachments: optimisticAttachments }
          : {}),
      },
    ]);
    this.isLoading.set(true);
    this.error.set(null);

    this.api.sendMessage(sid, content, files.length > 0 ? files : undefined).subscribe({
      next: (res) => {
        // Replace the optimistic user-message attachments with the canonical
        // persisted records (preserves the assistant message we just appended).
        if (res.messageAttachments && res.messageAttachments.length > 0) {
          this.messages.update((msgs) => {
            const next = [...msgs];
            for (let i = next.length - 1; i >= 0; i--) {
              if (next[i].role === 'user') {
                next[i] = { ...next[i], attachments: res.messageAttachments };
                break;
              }
            }
            return next;
          });
        }
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
        // Post-generation revision flow: when the agent has just received an
        // explicit confirmation of a revision plan, it sets `readyToRevise`
        // in the response. Auto-trigger regeneration to mirror the smooth
        // "user confirmed → system applies it" UX described in the ticket.
        if (res.readyToRevise === true && this.status() === 'complete') {
          this.generateBlueprint();
        }
      },
      error: (err) => {
        // Roll back the optimistic user message so failed messages don't
        // accumulate in the chat without a corresponding assistant response
        this.messages.set(msgsBefore);
        this.error.set(err?.error?.message ?? 'Failed to send message');
        this.isLoading.set(false);
      },
    });
  }

  generateBlueprint(): void {
    const sid = this.sessionId();
    if (!sid) return;

    // Snapshot whether a Blueprint already exists at the moment of the call.
    // Used to drive (a) revision-mode error recovery — keep the prior preview
    // intact on failure, and (b) skipping the canned post-generation prompt
    // re-injection on revision regenerations vs first-time generations
    // (we still want it after every regeneration; see `next` below).
    const isRevision = this.blueprint() !== null;

    this.isLoading.set(true);
    this.status.set('generating');
    this.error.set(null);

    this.api.generateBlueprint(sid).subscribe({
      next: (res) => {
        this.blueprint.set(res.blueprint);
        this.markdownDocument.set(res.markdownDocument);
        this.status.set('complete');
        this.isLoading.set(false);
        // Append the canned "what next?" prompt so the user always sees the
        // same fork after generation, whether it's the first run or a
        // revision regeneration. Adds a one-shot "focus the chat" signal so
        // the component can move keyboard focus to the textarea.
        this.appendPostGenerationPrompt();
      },
      error: (err) => {
        this.error.set(
          err?.error?.message ?? 'Failed to generate blueprint',
        );
        // Revision-regen failure: keep the user on the prior Blueprint
        // rather than booting them back into discovery. The backend
        // mirrors this behaviour on the server side.
        this.status.set(isRevision ? 'complete' : 'active');
        this.isLoading.set(false);
      },
    });
  }

  /**
   * Append the canned "Blueprint ready — revise or create workspace?" prompt
   * and bump `postGenerationPromptCount` so the component knows to focus
   * the chat input. Idempotent within a single tick (multiple consecutive
   * `appendPostGenerationPrompt()` calls collapse into one).
   */
  private appendPostGenerationPrompt(): void {
    const last = this.messages().at(-1);
    if (last?.role === 'assistant' && last.content === POST_GENERATION_PROMPT) {
      // Already present (e.g. from resume); skip duplicate.
      return;
    }
    this.messages.update((msgs) => [
      ...msgs,
      {
        role: 'assistant',
        content: POST_GENERATION_PROMPT,
        timestamp: new Date().toISOString(),
      },
    ]);
    this.postGenerationPromptCount.update((n) => n + 1);
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

  createWorkspaceFromBlueprint(): void {
    const sid = this.sessionId();
    if (!sid) return;

    this.isCreatingWorkspace.set(true);
    this.error.set(null);

    this.api.createWorkspaceFromBlueprint(sid).subscribe({
      next: (res) => {
        this.isCreatingWorkspace.set(false);
        this.router.navigate(['/new-workspace'], {
          queryParams: { resume: res.tenantId },
        });
      },
      error: (err) => {
        this.error.set(
          err?.error?.message ?? 'Failed to create workspace from blueprint',
        );
        this.isCreatingWorkspace.set(false);
      },
    });
  }

  private renderBlueprintMarkdown(bp: BlueprintDocumentContract): string {
    const lines: string[] = [];
    lines.push(`# THE BLINK BLUEPRINT`);
    lines.push('');
    lines.push(`**Prepared for:** ${bp.clientName}`);
    lines.push(`**Delivered:** ${bp.deliveredDate}`);
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('## Strategic Summary');
    lines.push('');
    lines.push(bp.strategicSummary);
    lines.push('');
    if (bp.businessObjectives?.length) {
      lines.push('## Business Objectives');
      lines.push('');
      for (const obj of bp.businessObjectives) {
        lines.push(`- **${obj.objective}** (${obj.category}) — ${obj.timeHorizon} — *${obj.metric}*`);
      }
      lines.push('');
    }
    if (bp.brandVoice) {
      lines.push('## Brand & Voice');
      lines.push('');
      lines.push(`> ${bp.brandVoice.positioningStatement}`);
      lines.push('');
      lines.push(`**Content Mission:** ${bp.brandVoice.contentMission}`);
      lines.push('');
    }
    if (bp.targetAudience) {
      lines.push('## Target Audience');
      lines.push('');
      lines.push(bp.targetAudience);
      lines.push('');
    }
    if (bp.audienceProfiles?.length) {
      lines.push('## Audience Profiles');
      lines.push('');
      for (const aud of bp.audienceProfiles) {
        lines.push(`### ${aud.name}`);
        lines.push(`${aud.demographics}`);
        lines.push('');
      }
    }
    if (bp.contentPillars?.length) {
      lines.push('## Content Pillars');
      lines.push('');
      for (const p of bp.contentPillars) {
        lines.push(`### ${p.name} (${p.sharePercent}%)`);
        lines.push(p.description);
        lines.push('');
      }
    }
    if (bp.channelsAndCadence?.length) {
      lines.push('## Channels & Cadence');
      lines.push('');
      for (const ch of bp.channelsAndCadence) {
        lines.push(`### ${ch.channel} — ${ch.role}`);
        lines.push(`**Frequency:** ${ch.frequency}`);
        lines.push('');
      }
    }
    if (bp.performanceScorecard?.length) {
      lines.push('## Performance Scorecard');
      lines.push('');
      lines.push('| Metric | Baseline | 30-Day | 90-Day |');
      lines.push('|--------|----------|--------|--------|');
      for (const m of bp.performanceScorecard) {
        lines.push(`| ${m.metric} | ${m.baseline} | ${m.thirtyDayTarget} | ${m.ninetyDayTarget} |`);
      }
      lines.push('');
    }
    if (bp.quickWins?.length) {
      lines.push('## First 30 Days — Quick Wins');
      lines.push('');
      bp.quickWins.forEach((win, i) => lines.push(`${i + 1}. ${win}`));
      lines.push('');
    }
    return lines.join('\n');
  }

  resumeSession(tenantId: string): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.api.resumeSession(tenantId).subscribe({
      next: (res) => {
        this.sessionId.set(res.sessionId);
        this.status.set(res.status);
        this.messages.set(res.messages);
        this.sections.set(res.sections);
        this.currentSection.set(res.currentSection);
        this.readyToGenerate.set(res.readyToGenerate);
        if (res.blueprint) {
          this.blueprint.set(res.blueprint);
          // Render markdown for the blueprint preview when resuming a completed session
          this.markdownDocument.set(this.renderBlueprintMarkdown(res.blueprint));
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(
          err?.error?.message ?? 'Failed to resume session',
        );
        this.isLoading.set(false);
      },
    });
  }
}
