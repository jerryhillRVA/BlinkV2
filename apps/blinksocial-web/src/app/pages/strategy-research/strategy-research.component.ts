import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
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
import {
  type StrategyView,
  type BusinessObjective,
  SIDEBAR_ITEMS,
} from './strategy-research.types';

@Component({
  selector: 'app-strategy-research',
  imports: [
    CommonModule,
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
  templateUrl: './strategy-research.component.html',
  styleUrl: './strategy-research.component.scss',
})
export class StrategyResearchComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly workspaceId = this.route.snapshot.paramMap.get('id') ?? '';
  readonly activeView = signal<StrategyView>('brand-voice');
  readonly objectives = signal<BusinessObjective[]>([]);

  readonly strategySections = SIDEBAR_ITEMS.filter(i => i.section === 'strategy');
  readonly researchSections = SIDEBAR_ITEMS.filter(i => i.section === 'research');
  readonly contentToolsSections = SIDEBAR_ITEMS.filter(i => i.section === 'content-tools');

  setActiveView(view: StrategyView): void {
    this.activeView.set(view);
  }

  onUpdateObjectives(updated: BusinessObjective[]): void {
    this.objectives.set(updated);
  }

  onNavigateBack(): void {
    this.router.navigate(['/']);
  }
}
