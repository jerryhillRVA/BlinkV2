import { Component, inject, signal, DestroyRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ObjectivesStripComponent } from './objectives-strip/objectives-strip.component';
import { BrandVoiceComponent } from './views/brand-voice/brand-voice.component';
import { StrategicPillarsComponent } from './views/strategic-pillars/strategic-pillars.component';
import { AudienceComponent } from './views/audience/audience.component';
import { ChannelStrategyComponent } from './views/channel-strategy/channel-strategy.component';
import { ContentMixComponent } from './views/content-mix/content-mix.component';
import { ResearchSourcesComponent } from './views/research-sources/research-sources.component';
import { CompetitorDeepDiveComponent } from './views/competitor-deep-dive/competitor-deep-dive.component';
import { ContentRepurposerComponent } from './views/content-repurposer/content-repurposer.component';
import { SeriesBuilderComponent } from './views/series-builder/series-builder.component';
import { AbAnalyzerComponent } from './views/ab-analyzer/ab-analyzer.component';
import { SeoHashtagsComponent } from './views/seo-hashtags/seo-hashtags.component';
import type { StrategyView, BusinessObjective, SidebarItem } from './strategy-research.types';
import { SIDEBAR_ITEMS } from './strategy-research.constants';
import { StrategyResearchStateService } from './strategy-research-state.service';

const SIDEBAR_SECTIONS: { label: string; items: SidebarItem[] }[] = [
  { label: 'Strategy', items: SIDEBAR_ITEMS.filter(i => i.section === 'strategy') },
  { label: 'Research', items: SIDEBAR_ITEMS.filter(i => i.section === 'research') },
  { label: 'Content Tools', items: SIDEBAR_ITEMS.filter(i => i.section === 'content-tools') },
];

@Component({
  selector: 'app-strategy-research',
  imports: [
    ObjectivesStripComponent,
    BrandVoiceComponent,
    StrategicPillarsComponent,
    AudienceComponent,
    ChannelStrategyComponent,
    ContentMixComponent,
    ResearchSourcesComponent,
    CompetitorDeepDiveComponent,
    ContentRepurposerComponent,
    SeriesBuilderComponent,
    AbAnalyzerComponent,
    SeoHashtagsComponent,
  ],
  providers: [StrategyResearchStateService],
  templateUrl: './strategy-research.component.html',
  styleUrl: './strategy-research.component.scss',
})
export class StrategyResearchComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly stateService = inject(StrategyResearchStateService);
  workspaceId = '';
  readonly activeView = signal<StrategyView>('brand-voice');

  readonly sidebarSections = SIDEBAR_SECTIONS;

  constructor() {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const id = params.get('id') ?? '';
        if (id !== this.workspaceId) {
          this.workspaceId = id;
          this.activeView.set('brand-voice');
          this.stateService.loadAll(id);
        }
      });
  }

  setActiveView(view: StrategyView): void {
    this.activeView.set(view);
  }

  onUpdateObjectives(updated: BusinessObjective[]): void {
    this.stateService.saveObjectives(updated);
  }
}
