export interface HealthResponseContract {
  status: string;
  timestamp: string;
  service: string;
}

export * from './workspace/index.js';
export * from './system/index.js';
export * from './onboarding/index.js';
