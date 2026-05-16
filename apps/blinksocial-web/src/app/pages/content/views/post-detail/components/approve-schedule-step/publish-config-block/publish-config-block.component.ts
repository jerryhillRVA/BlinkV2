import { Component, computed, input, output } from '@angular/core';
import type {
  ContentTypeContract,
  DeliveryMethodContract,
  PublishActionContract,
  PublishConfigContract,
  PublishVisibilityContract,
} from '@blinksocial/contracts';

export interface ConnectedAccountOption {
  id: string;
  handle: string;
}

const PUBLISH_ACTIONS: ReadonlyArray<{
  value: PublishActionContract;
  label: string;
}> = [
  { value: 'save-draft', label: 'Save Draft' },
  { value: 'schedule', label: 'Schedule' },
  { value: 'publish-now', label: 'Publish Now' },
  { value: 'export-packet', label: 'Export Packet' },
];

const DELIVERY_METHODS: ReadonlyArray<{
  value: DeliveryMethodContract;
  label: string;
}> = [
  { value: 'auto', label: 'Auto-publish' },
  { value: 'manual', label: 'Notify me to publish' },
];

const VISIBILITY_OPTIONS: ReadonlyArray<{
  value: PublishVisibilityContract;
  label: string;
}> = [
  { value: 'public', label: 'Public' },
  { value: 'unlisted', label: 'Unlisted' },
  { value: 'private', label: 'Private' },
];

const LIVE_CONTENT_TYPES: ReadonlyArray<ContentTypeContract> = [
  'live',
  'fb-live',
];

/**
 * Publish Settings block — publish-action picker, optional schedule
 * datetime, optional YT-long-form fields (visibility + Made for Kids),
 * connected-account selector, delivery method pills, notify-team
 * checkbox, and Live-only notify-followers switch.
 *
 * Single Input/Output: parent passes the current `publishConfig` and
 * receives `change` patches. The block does not persist directly — the
 * caller (the Approve & Schedule shell) routes the patch into the
 * store's `setPublishConfig` mutator.
 *
 * Named `publish-config-block` (not `publish-settings-card`) because
 * the IG packaging step already owns `publish-settings-card` for its
 * metadata sub-surface.
 */
@Component({
  selector: 'app-publish-config-block',
  templateUrl: './publish-config-block.component.html',
  styleUrl: './publish-config-block.component.scss',
})
export class PublishConfigBlockComponent {
  /* v8 ignore next 5 — V8's function-call-throws branches on input() declarations are unreachable (Angular class-field init time; ESM exports not spy-able) */
  readonly publishConfig = input.required<PublishConfigContract>();
  readonly scheduledAtLocal = input<string>('');
  readonly contentType = input<ContentTypeContract | null | undefined>(undefined);
  readonly isVideoLong = input<boolean>(false);
  readonly connectedAccounts = input<ReadonlyArray<ConnectedAccountOption>>([]);

  readonly configChange = output<Partial<PublishConfigContract>>();
  readonly scheduledAtChange = output<string | undefined>();

  protected readonly publishActions = PUBLISH_ACTIONS;
  protected readonly deliveryMethods = DELIVERY_METHODS;
  protected readonly visibilityOptions = VISIBILITY_OPTIONS;

  protected readonly publishAction = computed<PublishActionContract>(
    () => this.publishConfig().publishAction ?? 'save-draft',
  );

  protected readonly visibility = computed<PublishVisibilityContract>(
    () => this.publishConfig().visibility ?? 'public',
  );

  protected readonly madeForKids = computed<boolean>(
    () => !!this.publishConfig().madeForKids,
  );

  protected readonly accountId = computed<string>(
    () => this.publishConfig().accountId ?? '',
  );

  protected readonly deliveryMethod = computed<DeliveryMethodContract>(
    () => this.publishConfig().deliveryMethod ?? 'auto',
  );

  protected readonly notifyTeam = computed<boolean>(
    () => !!this.publishConfig().notifyTeam,
  );

  protected readonly notifyFollowers = computed<boolean>(
    () => !!this.publishConfig().notifyFollowers,
  );

  protected readonly showVisibilityFields = computed<boolean>(
    () => this.isVideoLong(),
  );

  protected readonly showLiveFields = computed<boolean>(() => {
    const ct = this.contentType();
    return !!ct && LIVE_CONTENT_TYPES.includes(ct);
  });

  protected readonly minDateTime = computed<string>(() =>
    new Date().toISOString().slice(0, 16),
  );

  protected readonly scheduledAtIsPast = computed<boolean>(() => {
    const v = this.scheduledAtLocal();
    if (!v) return false;
    const date = new Date(v);
    if (Number.isNaN(date.getTime())) return false;
    return date.getTime() <= Date.now();
  });

  protected readonly hasConnectedAccounts = computed<boolean>(
    () => this.connectedAccounts().length > 0,
  );

  protected onPublishAction(action: PublishActionContract): void {
    this.configChange.emit({ publishAction: action });
  }

  protected onScheduleAt(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.scheduledAtChange.emit(value || undefined);
  }

  protected onVisibility(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as PublishVisibilityContract;
    this.configChange.emit({ visibility: value });
  }

  protected onMadeForKids(event: Event): void {
    this.configChange.emit({ madeForKids: (event.target as HTMLInputElement).checked });
  }

  protected onAccount(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.configChange.emit({ accountId: value || undefined });
  }

  protected onDeliveryMethod(method: DeliveryMethodContract): void {
    this.configChange.emit({ deliveryMethod: method });
  }

  protected onNotifyTeam(event: Event): void {
    this.configChange.emit({ notifyTeam: (event.target as HTMLInputElement).checked });
  }

  protected onNotifyFollowers(event: Event): void {
    this.configChange.emit({ notifyFollowers: (event.target as HTMLInputElement).checked });
  }
}
