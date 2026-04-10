export interface CompetitorInsightContract {
  id: string;
  competitor: string;
  platform: string;
  contentType: string;
  topic: string;
  relevancyLevel: 'Very High' | 'High' | 'Medium';
  frequency: string;
  insight: string;
}
