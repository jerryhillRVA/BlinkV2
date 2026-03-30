export interface OnboardingMessageContract {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
