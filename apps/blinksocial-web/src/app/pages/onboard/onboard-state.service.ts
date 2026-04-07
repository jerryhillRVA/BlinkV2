import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
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

  sendMessage(content: string): void {
    const sid = this.sessionId();
    if (!sid) return;

    const now = new Date().toISOString();
    const msgsBefore = this.messages();
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
