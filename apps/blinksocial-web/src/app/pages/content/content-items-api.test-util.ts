import { of } from 'rxjs';
import type {
  ContentItemContract,
  UpdateContentItemRequestContract,
  CreateContentItemRequestContract,
} from '@blinksocial/contracts';
import { ContentItemsApiService } from './content-items-api.service';
import { WorkspaceSettingsApiService } from '../workspace-settings/workspace-settings-api.service';

/**
 * Test-only stubs for the HTTP-backed services that `ContentStateService`
 * depends on. Mutation methods echo the input so caller-side state updates
 * happen synchronously inside the tap pipe.
 */
export function provideContentItemsApiStubs() {
  const contentItemsStub = {
    getIndex: () => of({ items: [], totalCount: 0, lastUpdated: '' }),
    getArchiveIndex: () => of({ items: [], totalCount: 0, lastUpdated: '' }),
    getItem: () => of(null),
    createItem: (_workspaceId: string, body: CreateContentItemRequestContract) =>
      of({
        ...(body as ContentItemContract),
        id: `c-test-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    updateItem: (
      _workspaceId: string,
      itemId: string,
      patch: UpdateContentItemRequestContract,
    ) =>
      of({
        ...(patch as ContentItemContract),
        id: itemId,
        updatedAt: new Date().toISOString(),
      }),
    archiveItem: (_workspaceId: string, itemId: string) =>
      of({
        id: itemId,
        archived: true,
        updatedAt: new Date().toISOString(),
      } as ContentItemContract),
    unarchiveItem: (_workspaceId: string, itemId: string) =>
      of({
        id: itemId,
        archived: false,
        updatedAt: new Date().toISOString(),
      } as ContentItemContract),
    deleteItem: (_workspaceId: string, itemId: string) =>
      of({ deleted: true as const, id: itemId }),
  };

  const workspaceStub = {
    getSettings: () => of(null),
    saveSettings: (_id: string, _tab: string, data: unknown) => of(data),
    getNamespaceEntities: () => of([]),
    saveNamespaceEntities: (_id: string, _ns: string, data: unknown[]) => of(data),
    getNamespaceAggregate: () => of(null),
    saveNamespaceAggregate: (_id: string, _path: string, data: unknown) => of(data),
  };

  return [
    { provide: ContentItemsApiService, useValue: contentItemsStub },
    { provide: WorkspaceSettingsApiService, useValue: workspaceStub },
  ];
}
