import { Component, computed, inject } from '@angular/core';
import { PostDetailStore } from '../../post-detail.store';
import { PackagingBuilderPlaceholderComponent } from './builder-placeholder/builder-placeholder.component';
import { InstagramPackagingComponent } from './instagram-packaging/instagram-packaging.component';
import { TiktokPackagingComponent } from './tiktok-packaging/tiktok-packaging.component';
import { YoutubePackagingComponent } from './youtube-packaging/youtube-packaging.component';
import { LinkedinPackagingComponent } from './linkedin-packaging/linkedin-packaging.component';
import { FacebookPackagingComponent } from './facebook-packaging/facebook-packaging.component';
import { XPackagingComponent } from './x-packaging/x-packaging.component';

/**
 * Packaging step shell + factory. Dispatches on `item.platform` to one
 * of six per-platform builder components, or to the placeholder for
 * unset / unknown platforms.
 *
 * The 2-column layout is provided by the parent `post-detail.component`
 * (same pattern as the Brief + Draft steps); this component renders the
 * main column only.
 */
@Component({
  selector: 'app-packaging-step',
  imports: [
    PackagingBuilderPlaceholderComponent,
    InstagramPackagingComponent,
    TiktokPackagingComponent,
    YoutubePackagingComponent,
    LinkedinPackagingComponent,
    FacebookPackagingComponent,
    XPackagingComponent,
  ],
  templateUrl: './packaging-step.component.html',
  styleUrl: './packaging-step.component.scss',
})
export class PackagingStepComponent {
  protected readonly store = inject(PostDetailStore);

  protected readonly platform = computed(() => this.store.item()?.platform ?? null);

  protected readonly disabled = computed(() => !this.store.item()?.briefApproved);
}
