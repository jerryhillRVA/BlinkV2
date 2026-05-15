import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TooltipComponent } from '../../../../../shared/tooltip/tooltip.component';
import { PostDetailStore } from '../post-detail.store';
import { ContentStateService } from '../../../content-state.service';
import { AiAssistApiService } from '../../../../../core/ai-assist/ai-assist.service';
import { ToastService } from '../../../../../core/toast/toast.service';
import {
  CTA_TYPES,
  KEY_MESSAGE_MAX_CHARS,
  PRIMARY_CTA_OPTIONS,
  TRAFFIC_OBJECTIVES,
} from '../../../content.constants';
import { TEAM_MEMBERS_STUB, type TeamMemberStub } from '../../../team-members.stub';
import type { CtaType } from '../../../content.types';
import type { PrimaryCtaContract } from '@blinksocial/contracts';

@Component({
  selector: 'app-brief-step',
  imports: [DatePipe, FormsModule, TooltipComponent],
  templateUrl: './brief-step.component.html',
  styleUrl: './brief-step.component.scss',
})
export class BriefStepComponent {
  protected readonly store = inject(PostDetailStore);
  private readonly contentState = inject(ContentStateService);
  private readonly aiAssist = inject(AiAssistApiService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly keyMessageMax = KEY_MESSAGE_MAX_CHARS;
  protected readonly ctaOptions = CTA_TYPES;
  protected readonly primaryCtaOptions = PRIMARY_CTA_OPTIONS;
  protected readonly teamMembers: readonly TeamMemberStub[] = TEAM_MEMBERS_STUB;
  /* v8 ignore next 1 — V8's function-call-throws branches on input()/signal() declarations are unreachable (Angular class-field init time; ESM exports not spy-able) */
  protected readonly newRefLink = signal('');
  /* v8 ignore next 1 — V8's function-call-throws branches on input()/signal() declarations are unreachable (Angular class-field init time; ESM exports not spy-able) */
  protected readonly keyMessageAssisting = signal(false);

  protected readonly locked = computed(() => !!this.store.item()?.briefApproved);

  protected readonly keyMessageCount = computed(
    () => this.store.item()?.keyMessage?.length ?? 0,
  );

  protected readonly keyMessageTooShort = computed(() => {
    const n = this.keyMessageCount();
    return n > 0 && n < 10;
  });

  protected readonly keyMessageOverMax = computed(
    () => this.keyMessageCount() > this.keyMessageMax,
  );

  protected readonly showPrimaryCta = computed(() => {
    const obj = this.store.item()?.objective;
    return !!obj && TRAFFIC_OBJECTIVES.includes(obj);
  });

  protected onKeyMessageInput(e: Event): void {
    const v = (e.target as HTMLTextAreaElement | null)?.value ?? '';
    this.store.setKeyMessage(v);
  }

  protected onKeyMessageAssist(): void {
    if (this.locked() || this.keyMessageAssisting()) return;
    const item = this.store.item();
    const workspaceId = this.contentState.workspaceId();
    if (!item || !workspaceId) return;
    this.keyMessageAssisting.set(true);
    this.aiAssist
      .assist({
        scope: 'content-item',
        workspaceId,
        refId: item.id,
        field: 'post-key-message',
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const v = res.values[0]?.trim();
          if (v) this.store.setKeyMessage(v);
          this.keyMessageAssisting.set(false);
        },
        error: () => {
          this.toast.showError('AI Assist failed. Please try again.');
          this.keyMessageAssisting.set(false);
        },
      });
  }

  // ── Reference Links ─────────────────────────────────────────────────
  protected onRefLinkInput(e: Event): void {
    this.newRefLink.set((e.target as HTMLInputElement | null)?.value ?? '');
  }

  protected onRefLinkKeydown(e: KeyboardEvent): void {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const v = this.newRefLink().trim();
    if (!v) return;
    this.store.addReferenceLink(v);
    this.newRefLink.set('');
  }

  protected onAddRefLink(): void {
    const v = this.newRefLink().trim();
    if (!v) return;
    this.store.addReferenceLink(v);
    this.newRefLink.set('');
  }

  protected onRemoveRefLink(index: number): void {
    this.store.removeReferenceLink(index);
  }

  protected onEditRefLink(index: number, e: Event): void {
    const value = (e.target as HTMLInputElement | null)?.value ?? '';
    const next = [...this.store.referenceLinks()];
    next[index] = value;
    this.store.setReferenceLinks(next);
  }

  // ── Ownership & Timeline ────────────────────────────────────────────
  protected onOwnerChange(e: Event): void {
    const v = (e.target as HTMLSelectElement | null)?.value ?? '';
    this.store.setOwner(v);
  }

  protected onDueDateChange(e: Event): void {
    const v = (e.target as HTMLInputElement | null)?.value ?? '';
    this.store.setDueDate(v);
  }

  // ── Primary CTA + CTA Type ──────────────────────────────────────────
  protected onPrimaryCta(v: PrimaryCtaContract): void {
    if (this.locked()) return;
    this.store.togglePrimaryCta(v);
  }

  protected isPrimaryCta(v: PrimaryCtaContract): boolean {
    return this.store.primaryCta() === v;
  }

  protected onCtaType(v: CtaType): void {
    if (this.locked()) return;
    const current = this.store.item()?.cta?.type;
    if (current === v) {
      this.store.setCtaType('');
      return;
    }
    this.store.setCtaType(v);
  }

  protected isCtaType(v: CtaType): boolean {
    return this.store.item()?.cta?.type === v;
  }

  // ── Brief Status (approve / unlock / approval note) ────────────────
  protected get canApprove(): boolean {
    return this.store.canApprove();
  }

  protected onApproveToggle(e: Event): void {
    const checked = (e.target as HTMLInputElement | null)?.checked ?? false;
    if (checked && !this.canApprove) return;
    if (checked) {
      this.store.approveBrief();
    } else {
      this.store.unlockBrief();
    }
  }

  protected onApprovalNoteInput(e: Event): void {
    const v = (e.target as HTMLTextAreaElement | null)?.value ?? '';
    this.store.setApprovalNote(v);
  }

  protected onUnlock(): void {
    this.store.unlockBrief();
  }

}
