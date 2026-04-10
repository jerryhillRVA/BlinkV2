import { Component, DestroyRef, HostBinding, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type {
  AudienceSegment,
  ContentPillar,
  Platform,
  SeriesOverview,
  SeriesPost,
  SeriesPostRole,
} from '../../strategy-research.types';
import { MockDataService } from '../../../../core/mock-data/mock-data.service';
import {
  AI_SIMULATION_DELAY_MS,
  SERIES_GOAL_OPTIONS,
  SERIES_LENGTH_OPTIONS,
  SERIES_PLATFORM_OPTIONS,
} from '../../strategy-research.constants';
import {
  DEFAULT_PILLARS,
  DEFAULT_SEGMENTS,
  MOCK_SERIES,
} from '../../strategy-research.mock-data';
import { safeTimeout } from '../../strategy-research.utils';
import { PlatformIconComponent } from '../../../../shared/platform-icon/platform-icon.component';
import { DropdownComponent, DropdownOption } from '../../../../shared/dropdown/dropdown.component';

@Component({
  selector: 'app-series-builder',
  imports: [FormsModule, PlatformIconComponent, DropdownComponent],
  templateUrl: './series-builder.component.html',
  styleUrl: './series-builder.component.scss',
})
export class SeriesBuilderComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly mockData = inject(MockDataService);

  @HostBinding('class.is-mock-source')
  get isMockSource(): boolean {
    return this.mockData.isMock('series-builder');
  }

  /* v8 ignore start */
  readonly pillars = signal<ContentPillar[]>([...DEFAULT_PILLARS]);
  readonly segments = signal<AudienceSegment[]>([...DEFAULT_SEGMENTS]);
  readonly selectedSegmentId = signal<string>(DEFAULT_SEGMENTS[0]?.id ?? '');
  readonly selectedPillarId = signal<string>(DEFAULT_PILLARS[0]?.id ?? '');
  readonly selectedGoal = signal<string>(SERIES_GOAL_OPTIONS[0]);
  readonly selectedLength = signal<string>('5');
  readonly selectedPlatform = signal<Platform>('instagram');
  readonly isGenerating = signal(false);
  readonly series = signal<SeriesOverview | null>(null);
  readonly postTitles = signal<Record<number, string>>({});
  readonly titleErrors = signal<Set<number>>(new Set());
  readonly savedPosts = signal<Set<number>>(new Set());
  /* v8 ignore stop */

  readonly canBuild = computed(() =>
    !!this.selectedSegmentId() &&
    !!this.selectedPillarId() &&
    !!this.selectedGoal() &&
    !!this.selectedLength() &&
    !!this.selectedPlatform()
  );

  readonly selectedPillar = computed(() =>
    this.pillars().find(p => p.id === this.selectedPillarId()) ?? null
  );

  readonly unsavedCount = computed(() => {
    const s = this.series();
    return s ? s.posts.length - this.savedPosts().size : 0;
  });

  readonly segmentDropdownOptions: DropdownOption[] = DEFAULT_SEGMENTS.map(s => ({ value: s.id, label: s.name }));
  readonly pillarDropdownOptions: DropdownOption[] = DEFAULT_PILLARS.map(p => ({ value: p.id, label: p.name }));
  readonly goalDropdownOptions: DropdownOption[] = SERIES_GOAL_OPTIONS.map(g => ({ value: g, label: g }));
  readonly lengthDropdownOptions: DropdownOption[] = SERIES_LENGTH_OPTIONS.map(l => ({ value: l, label: `${l} posts` }));
  readonly platformDropdownOptions: DropdownOption[] = SERIES_PLATFORM_OPTIONS.map(p => ({ value: p.value, label: p.label }));

  setSegment(value: string): void { this.selectedSegmentId.set(value); }
  setPillar(value: string): void { this.selectedPillarId.set(value); }
  setGoal(value: string): void { this.selectedGoal.set(value); }
  setLength(value: string): void { this.selectedLength.set(value); }
  setPlatform(value: string): void { this.selectedPlatform.set(value as Platform); }

  getRoleClass(role: SeriesPostRole): string {
    switch (role) {
      case 'Hook': return 'role--hook';
      case 'Value': return 'role--value';
      case 'Proof': return 'role--proof';
      case 'Pivot': return 'role--pivot';
      case 'Conversion': return 'role--conversion';
      default: return '';
    }
  }

  buildSeries(): void {
    if (!this.canBuild() || this.isGenerating()) return;
    this.isGenerating.set(true);
    this.series.set(null);
    this.postTitles.set({});
    this.titleErrors.set(new Set());
    this.savedPosts.set(new Set());
    safeTimeout(() => {
      const length = Number.parseInt(this.selectedLength(), 10) || 5;
      const posts: SeriesPost[] = MOCK_SERIES.posts.slice(0, length).map(p => ({ ...p }));
      const built: SeriesOverview = {
        ...MOCK_SERIES,
        platform: this.selectedPlatform(),
        postCount: length,
        goal: this.selectedGoal(),
        pillarId: this.selectedPillarId(),
        segmentId: this.selectedSegmentId(),
        posts,
      };
      this.series.set(built);
      const titles: Record<number, string> = {};
      for (const p of posts) titles[p.number] = p.title;
      this.postTitles.set(titles);
      this.isGenerating.set(false);
    }, AI_SIMULATION_DELAY_MS, this.destroyRef);
  }

  setPostTitle(num: number, value: string): void {
    this.postTitles.update(m => ({ ...m, [num]: value }));
    if (value.trim()) {
      this.titleErrors.update(set => {
        const next = new Set(set);
        next.delete(num);
        return next;
      });
    }
  }

  createPost(post: SeriesPost): void {
    const title = (this.postTitles()[post.number] ?? '').trim();
    if (!title) {
      this.titleErrors.update(set => new Set(set).add(post.number));
      return;
    }
    this.savedPosts.update(set => new Set(set).add(post.number));
  }

  createAllPosts(): void {
    const s = this.series();
    if (!s) return;
    for (const post of s.posts) {
      if (this.savedPosts().has(post.number)) continue;
      this.createPost(post);
    }
  }

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
