export interface ResearchSourceContract {
  id: string;
  title: string;
  url: string;
  type: 'article' | 'report' | 'social' | 'news' | 'video';
  relevance: number;
  pillarIds: string[];
  summary: string;
  discoveredAt: string;
}
