import { Component, computed, input, output, signal } from '@angular/core';
import type {
  ContentTypeContract,
  PackagingInstagramContract,
  PackagingPlatformControlsIGContract,
  PlatformContract,
} from '@blinksocial/contracts';

/**
 * IG metadata patch payload — the parent uses Object.assign on the
 * Instagram contract slot. Keys are the prototype's `igPeopleTags` etc.,
 * unprefixed (the slot is already IG-scoped).
 */
export interface PublishSettingsIGMetadataPatch {
  peopleTags?: string[];
  productTags?: string[];
  reelsCoverTag?: string;
}

/**
 * Publish Settings card — collapsible parent + two collapsible sub-sections
 * (Metadata, Platform Controls). Replaces the old <app-platform-controls>
 * for IG; mirrors PublishSettingsCard.tsx in the prototype. Other 5
 * builders continue using the legacy flat card until aligned in subsequent
 * rounds.
 */
@Component({
  selector: 'app-publish-settings-card',
  templateUrl: './publish-settings-card.component.html',
  styleUrl: './publish-settings-card.component.scss',
})
export class PublishSettingsCardComponent {
  readonly platform = input.required<PlatformContract>();
  /* v8 ignore next 4 — signal-input default-value branches are unreachable from TestBed */
  readonly contentType = input<ContentTypeContract | null | undefined>(undefined);
  readonly disabled = input(false);
  readonly igMetadata = input<Partial<PackagingInstagramContract> | undefined>(undefined);
  readonly igControls = input<PackagingPlatformControlsIGContract | undefined>(undefined);

  readonly igMetadataChange = output<PublishSettingsIGMetadataPatch>();
  readonly igControlsChange = output<PackagingPlatformControlsIGContract>();

  protected readonly cardOpen = signal(false);
  protected readonly metadataOpen = signal(true);
  protected readonly controlsOpen = signal(true);

  // ── Render gating (IG) ─────────────────────────────────────────────
  protected readonly isIG = computed(() => this.platform() === 'instagram');
  protected readonly ctype = computed(() => this.contentType() ?? '');

  protected readonly showIgPeopleTags = computed(() =>
    this.isIG() && ['reel', 'feed-post', 'carousel'].includes(this.ctype()),
  );
  protected readonly showIgProductTags = computed(() =>
    this.isIG() && ['reel', 'feed-post'].includes(this.ctype()),
  );
  protected readonly showIgReelsCover = computed(
    () => this.isIG() && this.ctype() === 'reel',
  );

  // Controls visibility per content-type — mirrors prototype's pcRenderIG.
  protected readonly showIgCommentsOff = computed(() =>
    this.isIG() && ['reel', 'feed-post', 'carousel', 'story'].includes(this.ctype()),
  );
  protected readonly showIgHideLikeCount = computed(() =>
    this.isIG() && ['reel', 'feed-post', 'carousel'].includes(this.ctype()),
  );
  protected readonly showIgPaidPartnership = computed(() =>
    this.isIG() && ['reel', 'feed-post', 'carousel', 'story'].includes(this.ctype()),
  );
  protected readonly showIgCollaboratorTag = computed(() =>
    this.isIG() && ['reel', 'feed-post', 'carousel'].includes(this.ctype()),
  );
  protected readonly showIgCloseFriendsOnly = computed(
    () => this.isIG() && this.ctype() === 'story',
  );
  protected readonly showIgLiveRows = computed(
    () => this.isIG() && this.ctype() === 'live',
  );

  // Did the active platform/contentType have any rows to render?
  protected readonly hasMetadataRows = computed(
    () => this.showIgPeopleTags() || this.showIgProductTags() || this.showIgReelsCover(),
  );
  protected readonly hasControlsRows = computed(
    () =>
      this.showIgCommentsOff() ||
      this.showIgHideLikeCount() ||
      this.showIgPaidPartnership() ||
      this.showIgCollaboratorTag() ||
      this.showIgCloseFriendsOnly() ||
      this.showIgLiveRows(),
  );

  // ── Field accessors (IG) ───────────────────────────────────────────
  protected readonly igPeopleTags = computed(() => this.igMetadata()?.peopleTags ?? []);
  protected readonly igProductTags = computed(
    () => this.igMetadata()?.productTags ?? [],
  );
  protected readonly igReelsCoverTag = computed(
    () => this.igMetadata()?.reelsCoverTag ?? '',
  );
  protected readonly igCtrls = computed(() => this.igControls() ?? {});

  // Chip input drafts — local-only, not persisted until Enter/Add.
  protected readonly peopleDraft = signal('');
  protected readonly productDraft = signal('');
  protected readonly coHostDraft = signal('');

  // ── User actions ───────────────────────────────────────────────────
  protected toggleCard(): void {
    this.cardOpen.update((v) => !v);
  }
  protected toggleMetadata(): void {
    this.metadataOpen.update((v) => !v);
  }
  protected toggleControls(): void {
    this.controlsOpen.update((v) => !v);
  }

  // Chip primitives — IG metadata only.
  protected addPeopleTag(): void {
    const next = this.peopleDraft().trim();
    if (!next || this.disabled()) return;
    const cur = this.igPeopleTags();
    if (cur.includes(next)) {
      this.peopleDraft.set('');
      return;
    }
    this.igMetadataChange.emit({ peopleTags: [...cur, next] });
    this.peopleDraft.set('');
  }
  protected removePeopleTag(tag: string): void {
    if (this.disabled()) return;
    this.igMetadataChange.emit({
      peopleTags: this.igPeopleTags().filter((t) => t !== tag),
    });
  }
  protected onPeopleDraftInput(e: Event): void {
    this.peopleDraft.set((e.target as HTMLInputElement).value);
  }
  protected onPeopleDraftKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter') {
      e.preventDefault();
      this.addPeopleTag();
    }
  }

  protected addProductTag(): void {
    const next = this.productDraft().trim();
    if (!next || this.disabled()) return;
    const cur = this.igProductTags();
    if (cur.includes(next)) {
      this.productDraft.set('');
      return;
    }
    this.igMetadataChange.emit({ productTags: [...cur, next] });
    this.productDraft.set('');
  }
  protected removeProductTag(tag: string): void {
    if (this.disabled()) return;
    this.igMetadataChange.emit({
      productTags: this.igProductTags().filter((t) => t !== tag),
    });
  }
  protected onProductDraftInput(e: Event): void {
    this.productDraft.set((e.target as HTMLInputElement).value);
  }
  protected onProductDraftKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter') {
      e.preventDefault();
      this.addProductTag();
    }
  }

  protected onReelsCoverInput(e: Event): void {
    if (this.disabled()) return;
    const value = (e.target as HTMLInputElement).value;
    this.igMetadataChange.emit({ reelsCoverTag: value });
  }

  // IG controls — toggles + collaborator + live rows.
  protected emitIgControl(patch: Partial<PackagingPlatformControlsIGContract>): void {
    if (this.disabled()) return;
    this.igControlsChange.emit({ ...this.igCtrls(), ...patch });
  }

  protected toggleIgCommentsOff(): void {
    this.emitIgControl({ commentsOff: !this.igCtrls().commentsOff });
  }
  protected toggleIgHideLikeCount(): void {
    this.emitIgControl({ hideLikeCount: !this.igCtrls().hideLikeCount });
  }
  protected toggleIgPaidPartnership(): void {
    this.emitIgControl({ paidPartnership: !this.igCtrls().paidPartnership });
  }
  protected toggleIgCloseFriendsOnly(): void {
    this.emitIgControl({ closeFreindsOnly: !this.igCtrls().closeFreindsOnly });
  }
  protected toggleIgQaMode(): void {
    this.emitIgControl({ qaMode: !this.igCtrls().qaMode });
  }
  protected toggleIgNotifyFollowers(): void {
    this.emitIgControl({ notifyFollowers: !this.igCtrls().notifyFollowers });
  }

  protected onIgCollaboratorTagInput(e: Event): void {
    const value = (e.target as HTMLInputElement).value;
    this.emitIgControl({ collaboratorTag: value });
  }
  protected onIgFundraiserGoalInput(e: Event): void {
    const value = (e.target as HTMLInputElement).value;
    this.emitIgControl({ fundraiserGoal: value });
  }

  protected get igCoHostHandles(): string[] {
    return this.igCtrls().coHostHandles ?? [];
  }
  protected onCoHostDraftInput(e: Event): void {
    this.coHostDraft.set((e.target as HTMLInputElement).value);
  }
  protected onCoHostKeydown(e: KeyboardEvent): void {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const cur = this.igCoHostHandles;
    if (cur.length >= 4) return;
    const handle = this.coHostDraft().trim().replace(/^@/, '');
    if (!handle) return;
    this.emitIgControl({ coHostHandles: [...cur, handle] });
    this.coHostDraft.set('');
  }
  protected removeCoHost(handle: string): void {
    if (this.disabled()) return;
    this.emitIgControl({
      coHostHandles: this.igCoHostHandles.filter((h) => h !== handle),
    });
  }
}
