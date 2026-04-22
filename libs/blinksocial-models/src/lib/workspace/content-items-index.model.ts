import type {
  ContentItemsIndexEntryContract,
  ContentItemsIndexContract,
  ContentItemsArchiveIndexContract,
  ContentStageContract,
  ContentStatusContract,
  PlatformContract,
  ContentTypeContract,
} from '@blinksocial/contracts';

export class ContentItemsIndexEntry implements ContentItemsIndexEntryContract {
  id!: string;
  stage!: ContentStageContract;
  status!: ContentStatusContract;
  title!: string;
  platform!: PlatformContract | null;
  contentType!: ContentTypeContract | null;
  pillarIds!: string[];
  segmentIds!: string[];
  owner!: string | null;
  parentIdeaId!: string | null;
  parentConceptId!: string | null;
  scheduledDate!: string | null;
  archived!: boolean;
  createdAt!: string;
  updatedAt!: string;

  constructor(data: Partial<ContentItemsIndexEntryContract> = {}) {
    Object.assign(this, data);
  }
}

export class ContentItemsIndex implements ContentItemsIndexContract {
  items!: ContentItemsIndexEntryContract[];
  totalCount!: number;
  lastUpdated!: string;

  constructor(data: Partial<ContentItemsIndexContract> = {}) {
    this.items = data.items ?? [];
    this.totalCount = data.totalCount ?? 0;
    this.lastUpdated = data.lastUpdated ?? new Date().toISOString();
  }
}

export class ContentItemsArchiveIndex implements ContentItemsArchiveIndexContract {
  items!: ContentItemsIndexEntryContract[];
  totalCount!: number;
  lastUpdated!: string;

  constructor(data: Partial<ContentItemsArchiveIndexContract> = {}) {
    this.items = data.items ?? [];
    this.totalCount = data.totalCount ?? 0;
    this.lastUpdated = data.lastUpdated ?? new Date().toISOString();
  }
}
