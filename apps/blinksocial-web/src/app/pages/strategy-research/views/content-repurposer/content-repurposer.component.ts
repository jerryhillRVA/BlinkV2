import {
  Component,
  DestroyRef,
  EmbeddedViewRef,
  HostBinding,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type {
  AudienceSegment,
  ContentPillar,
  Platform,
  RepurposeOutput,
  RepurposeOutputCard,
  SavedIdeaRecord,
} from '../../strategy-research.types';
import { AI_SIMULATION_DELAY_MS } from '../../strategy-research.constants';
import {
  DEFAULT_PILLARS,
  DEFAULT_SEGMENTS,
  MOCK_REPURPOSE_CARD_THEMES,
  MOCK_REPURPOSE_OUTPUT,
} from '../../strategy-research.mock-data';
import { generateId, safeTimeout, toggleSetItem } from '../../strategy-research.utils';
import { MockDataService } from '../../../../core/mock-data/mock-data.service';
import { PlatformIconComponent } from '../../../../shared/platform-icon/platform-icon.component';

const ALL_PLATFORMS: Platform[] = ['instagram', 'tiktok', 'youtube', 'linkedin', 'facebook'];

const PLATFORM_LABEL: Record<Platform, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
};

function areSetsEqual<T>(a: Set<T>, b: Set<T>): boolean {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

function buildCards(output: RepurposeOutput, platforms: Set<Platform>): RepurposeOutputCard[] {
  const cards: RepurposeOutputCard[] = [];
  if (platforms.has('instagram')) {
    cards.push({
      key: 'reelHooks', platformId: 'instagram', label: 'Instagram Reel',
      badge: 'Reel Hook', badgeClass: 'badge--instagram',
      content: output.reelHooks.map((h, i) => `${i + 1}. ${h}`).join('\n'),
    });
    cards.push({
      key: 'carousel', platformId: 'instagram', label: 'Instagram Carousel',
      badge: 'Carousel Concept', badgeClass: 'badge--instagram',
      content: output.carouselSlides.map((s, i) => `Slide ${i + 1} [${s.role}]: ${s.headline}`).join('\n'),
    });
    cards.push({
      key: 'caption', platformId: 'instagram', label: 'Instagram Caption',
      badge: 'Caption', badgeClass: 'badge--instagram',
      content: output.instagramCaption,
    });
  }
  if (platforms.has('tiktok')) {
    cards.push({
      key: 'tiktok', platformId: 'tiktok', label: 'TikTok',
      badge: 'Short Video Hook', badgeClass: 'badge--tiktok',
      content: output.tiktokHook,
    });
  }
  if (platforms.has('youtube')) {
    cards.push({
      key: 'youtube', platformId: 'youtube', label: 'YouTube Short',
      badge: 'YouTube Short', badgeClass: 'badge--youtube',
      content: output.youtubeShort,
    });
  }
  if (platforms.has('linkedin')) {
    cards.push({
      key: 'linkedin', platformId: 'linkedin', label: 'LinkedIn',
      badge: 'Text Post', badgeClass: 'badge--linkedin',
      content: output.linkedinPost,
    });
  }
  if (platforms.has('facebook')) {
    cards.push({
      key: 'facebook', platformId: 'facebook', label: 'Facebook',
      badge: 'Post', badgeClass: 'badge--facebook',
      content: output.facebookPost,
    });
  }
  return cards;
}

function defaultTitleForCard(card: RepurposeOutputCard): string {
  const theme = MOCK_REPURPOSE_CARD_THEMES[card.key] ?? 'Content Repurpose';
  return `${card.label} — ${theme}`;
}

@Component({
  selector: 'app-content-repurposer',
  imports: [FormsModule, PlatformIconComponent],
  templateUrl: './content-repurposer.component.html',
  styleUrl: './content-repurposer.component.scss',
})
export class ContentRepurposerComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly mockData = inject(MockDataService);
  private readonly doc = inject(DOCUMENT);
  private readonly vcr = inject(ViewContainerRef);

  @ViewChild('regenerateDialogTpl', { static: true }) regenerateDialogTpl!: TemplateRef<unknown>;
  private modalView: EmbeddedViewRef<unknown> | null = null;

  @HostBinding('class.is-mock-source')
  get isMockSource(): boolean {
    return this.mockData.isMock('content-repurposer');
  }

  readonly platformLabel = PLATFORM_LABEL;
  readonly allPlatforms = ALL_PLATFORMS;

  /* v8 ignore start */
  readonly sources = signal<string[]>(['']);
  readonly selectedPlatforms = signal<Set<Platform>>(new Set(ALL_PLATFORMS));
  readonly pillars = signal<ContentPillar[]>([...DEFAULT_PILLARS]);
  readonly segments = signal<AudienceSegment[]>([...DEFAULT_SEGMENTS]);
  readonly selectedPillarIds = signal<Set<string>>(new Set());
  readonly selectedSegmentIds = signal<Set<string>>(new Set());
  readonly lastRunPillarIds = signal<Set<string>>(new Set());
  readonly lastRunSegmentIds = signal<Set<string>>(new Set());
  readonly lastRunPlatforms = signal<Set<Platform>>(new Set());
  readonly isGenerating = signal(false);
  readonly output = signal<RepurposeOutput | null>(null);
  readonly savedCards = signal<Set<string>>(new Set());
  readonly dismissedCards = signal<Set<string>>(new Set());
  readonly copiedCard = signal<string | null>(null);
  readonly cardTitles = signal<Record<string, string>>({});
  readonly titleErrors = signal<Set<string>>(new Set());
  readonly savedIdeaRecords = signal<SavedIdeaRecord[]>([]);
  readonly showRegenerateDialog = signal(false);
  /* v8 ignore stop */

  readonly cards = computed(() => {
    const out = this.output();
    return out ? buildCards(out, this.selectedPlatforms()) : [];
  });

  readonly visibleCards = computed(() =>
    this.cards().filter(c => !this.dismissedCards().has(c.key))
  );

  readonly unsavedCount = computed(() =>
    this.visibleCards().filter(c => !this.savedCards().has(c.key)).length
  );

  readonly hasSource = computed(() => this.sources().some(s => s.trim().length > 0));

  readonly canRepurpose = computed(() => this.hasSource() && this.selectedPlatforms().size > 0);

  readonly hasPendingChanges = computed(() =>
    this.output() !== null &&
    !this.isGenerating() &&
    (
      !areSetsEqual(this.selectedPillarIds(), this.lastRunPillarIds()) ||
      !areSetsEqual(this.selectedSegmentIds(), this.lastRunSegmentIds()) ||
      !areSetsEqual(this.selectedPlatforms(), this.lastRunPlatforms())
    )
  );

  constructor() {
    effect(() => {
      const open = this.showRegenerateDialog();
      const body = this.doc.body;
      if (open && this.regenerateDialogTpl && !this.modalView) {
        this.modalView = this.vcr.createEmbeddedView(this.regenerateDialogTpl);
        this.modalView.detectChanges();
        /* v8 ignore start */
        for (const node of this.modalView.rootNodes as Node[]) {
          if (node.nodeType === 1) body.appendChild(node);
        }
        /* v8 ignore stop */
        body.style.overflow = 'hidden';
      } else if (!open && this.modalView) {
        this.modalView.destroy();
        this.modalView = null;
        body.style.overflow = '';
      }
    });
    /* v8 ignore start */
    this.destroyRef.onDestroy(() => {
      if (this.modalView) {
        this.modalView.destroy();
        this.modalView = null;
      }
      if (this.doc.body) this.doc.body.style.overflow = '';
    });
    /* v8 ignore stop */
  }

  // ── Source helpers ──────────────────────────────────────
  addSource(): void {
    if (this.sources().length >= 3) return;
    this.sources.update(list => [...list, '']);
  }

  removeSource(index: number): void {
    this.sources.update(list => list.filter((_, i) => i !== index));
  }

  updateSource(index: number, value: string): void {
    this.sources.update(list => list.map((s, i) => (i === index ? value : s)));
  }

  formatChars(value: string): string {
    return value.length.toLocaleString();
  }

  // ── Selection helpers ───────────────────────────────────
  isPlatformSelected(platform: Platform): boolean {
    return this.selectedPlatforms().has(platform);
  }

  togglePlatform(platform: Platform): void {
    this.selectedPlatforms.update(set => toggleSetItem(set, platform));
  }

  isPillarSelected(id: string): boolean {
    return this.selectedPillarIds().has(id);
  }

  togglePillar(id: string): void {
    this.selectedPillarIds.update(set => toggleSetItem(set, id));
  }

  isSegmentSelected(id: string): boolean {
    return this.selectedSegmentIds().has(id);
  }

  toggleSegment(id: string): void {
    this.selectedSegmentIds.update(set => toggleSetItem(set, id));
  }

  // ── Generation ──────────────────────────────────────────
  repurpose(): void {
    if (!this.canRepurpose() || this.isGenerating()) return;
    const autoPillarIds = new Set(this.pillars().slice(0, 2).map(p => p.id));
    const autoSegmentIds = new Set(this.segments().slice(0, 1).map(s => s.id));
    this.selectedPillarIds.set(autoPillarIds);
    this.selectedSegmentIds.set(autoSegmentIds);
    this.savedCards.set(new Set());
    this.dismissedCards.set(new Set());
    this.titleErrors.set(new Set());
    this.savedIdeaRecords.set([]);
    this.runGeneration(this.selectedPlatforms(), autoPillarIds, autoSegmentIds);
  }

  private runGeneration(
    platforms: Set<Platform>,
    pillarIds: Set<string>,
    segmentIds: Set<string>,
  ): void {
    this.isGenerating.set(true);
    safeTimeout(() => {
      const combinedSource = this.sources().filter(s => s.trim()).join('\n\n---\n\n');
      const newOutput: RepurposeOutput = {
        sourceText: combinedSource,
        pillarId: [...pillarIds][0] || '',
        segmentId: [...segmentIds][0] || '',
        generatedAt: new Date().toISOString(),
        reelHooks: [...MOCK_REPURPOSE_OUTPUT.reelHooks],
        carouselSlides: MOCK_REPURPOSE_OUTPUT.carouselSlides.map(s => ({ ...s })),
        instagramCaption: MOCK_REPURPOSE_OUTPUT.instagramCaption,
        tiktokHook: MOCK_REPURPOSE_OUTPUT.tiktokHook,
        youtubeShort: MOCK_REPURPOSE_OUTPUT.youtubeShort,
        linkedinPost: MOCK_REPURPOSE_OUTPUT.linkedinPost,
        facebookPost: MOCK_REPURPOSE_OUTPUT.facebookPost,
      };
      this.output.set(newOutput);
      this.lastRunPillarIds.set(new Set(pillarIds));
      this.lastRunSegmentIds.set(new Set(segmentIds));
      this.lastRunPlatforms.set(new Set(platforms));

      const generatedCards = buildCards(newOutput, platforms);
      const titles: Record<string, string> = {};
      for (const c of generatedCards) titles[c.key] = defaultTitleForCard(c);
      this.cardTitles.set(titles);

      this.isGenerating.set(false);
    }, AI_SIMULATION_DELAY_MS, this.destroyRef);
  }

  // ── Card actions ───────────────────────────────────────
  copyCard(card: RepurposeOutputCard): void {
    /* v8 ignore next */
    navigator.clipboard?.writeText(card.content);
    this.copiedCard.set(card.key);
    safeTimeout(() => {
      if (this.copiedCard() === card.key) this.copiedCard.set(null);
    }, 2000, this.destroyRef);
  }

  setCardTitle(key: string, value: string): void {
    this.cardTitles.update(m => ({ ...m, [key]: value }));
    if (value.trim()) {
      this.titleErrors.update(set => {
        const next = new Set(set);
        next.delete(key);
        return next;
      });
    }
  }

  saveCard(card: RepurposeOutputCard): void {
    const title = (this.cardTitles()[card.key] ?? '').trim();
    if (!title) {
      this.titleErrors.update(set => new Set(set).add(card.key));
      return;
    }
    this.savedCards.update(set => new Set(set).add(card.key));
  }

  saveAllCards(): void {
    for (const card of this.visibleCards()) {
      if (this.savedCards().has(card.key)) continue;
      this.saveCard(card);
    }
  }

  dismissCard(key: string): void {
    this.dismissedCards.update(set => new Set(set).add(key));
  }

  restoreAll(): void {
    this.dismissedCards.set(new Set());
  }

  // ── Regenerate dialog ──────────────────────────────────
  openRegenerateDialog(): void {
    this.showRegenerateDialog.set(true);
  }

  closeRegenerateDialog(): void {
    this.showRegenerateDialog.set(false);
  }

  confirmRegenerate(): void {
    this.showRegenerateDialog.set(false);
    const newRecords: SavedIdeaRecord[] = this.cards()
      .filter(c => this.savedCards().has(c.key))
      .map(c => ({
        uid: generateId(`saved-${c.key}`),
        title: this.cardTitles()[c.key] || c.label,
        platformId: c.platformId,
        badge: c.badge,
        badgeClass: c.badgeClass,
      }));
    this.savedIdeaRecords.update(list => [...list, ...newRecords]);
    this.output.set(null);
    this.savedCards.set(new Set());
    this.dismissedCards.set(new Set());
    this.cardTitles.set({});
    this.titleErrors.set(new Set());
    this.runGeneration(this.selectedPlatforms(), this.selectedPillarIds(), this.selectedSegmentIds());
  }

  // ── Lookups ────────────────────────────────────────────
  pillarColor(id: string): string {
    return this.pillars().find(p => p.id === id)?.color ?? 'var(--blink-on-surface-muted)';
  }

  pillarName(id: string): string {
    return this.pillars().find(p => p.id === id)?.name ?? id;
  }

  segmentName(id: string): string {
    return this.segments().find(s => s.id === id)?.name ?? id;
  }
}
