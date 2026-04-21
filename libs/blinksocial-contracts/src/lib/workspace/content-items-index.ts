import type {
  ContentStageContract,
  ContentStatusContract,
  PlatformContract,
  ContentTypeContract,
  ContentItemContract,
} from './content-item.js';

export interface ContentItemsIndexEntryContract {
  id: string;
  stage: ContentStageContract;
  status: ContentStatusContract;
  title: string;
  platform: PlatformContract | null;
  contentType: ContentTypeContract | null;
  pillarIds: string[];
  segmentIds: string[];
  owner: string | null;
  parentIdeaId: string | null;
  parentConceptId: string | null;
  scheduledDate: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ContentItemsIndexContract {
  items: ContentItemsIndexEntryContract[];
  totalCount: number;
  lastUpdated: string;
}

export interface ContentItemsArchiveIndexContract {
  items: ContentItemsIndexEntryContract[];
  totalCount: number;
  lastUpdated: string;
}

export type CreateContentItemRequestContract = Omit<
  Partial<ContentItemContract>,
  'id' | 'createdAt' | 'updatedAt'
> & {
  stage: ContentStageContract;
  status: ContentStatusContract;
  title: string;
};

export type CreateIdeaRequestContract = CreateContentItemRequestContract & {
  stage: 'idea';
};

export type CreateConceptRequestContract = CreateContentItemRequestContract & {
  stage: 'concept';
  parentIdeaId?: string;
};

export type CreatePostRequestContract = CreateContentItemRequestContract & {
  stage: 'post';
  parentConceptId?: string;
};

export type UpdateContentItemRequestContract = Partial<
  Omit<ContentItemContract, 'id' | 'createdAt'>
>;

export interface ArchiveContentItemRequestContract {
  archived: boolean;
}
