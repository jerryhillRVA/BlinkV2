import { Component, inject } from '@angular/core';
import { NewWorkspaceFormService } from '../../new-workspace-form.service';
import { PLATFORM_DISPLAY_OPTIONS, displayNameToPlatform, Platform } from '@blinksocial/contracts';
import { PlatformIconComponent, PlatformName } from '../../../../shared/platform-icon/platform-icon.component';

@Component({
  selector: 'app-step-platform-config',
  imports: [PlatformIconComponent],
  templateUrl: './step-platform-config.component.html',
  styleUrl: './step-platform-config.component.scss',
})
export class StepPlatformConfigComponent {
  protected readonly formService = inject(NewWorkspaceFormService);

  readonly PLATFORMS = PLATFORM_DISPLAY_OPTIONS;

  platformIconName(displayName: string): PlatformName {
    return (displayNameToPlatform(displayName) ?? Platform.Tbd) as PlatformName;
  }
}
