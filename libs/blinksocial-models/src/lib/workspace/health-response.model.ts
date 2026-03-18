import type { HealthResponseContract } from '@blinksocial/contracts';

export class HealthResponse implements HealthResponseContract {
  readonly status: string;
  readonly timestamp: string;
  readonly service: string;

  constructor(data: HealthResponseContract) {
    this.status = data.status;
    this.timestamp = data.timestamp;
    this.service = data.service;
  }
}
