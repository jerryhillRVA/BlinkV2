import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/decorators';

@Controller('api/health')
@Public()
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'blinksocial-api',
    };
  }
}
