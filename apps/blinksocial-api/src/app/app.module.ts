import { Module } from '@nestjs/common';
import { HealthModule } from '../health/health.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { AngularSsrModule } from '../angular-ssr/angular-ssr.module';

@Module({
  imports: [
    HealthModule,
    WorkspacesModule,
    // AngularSsrModule must be last — it registers a catch-all middleware
    AngularSsrModule,
  ],
})
export class AppModule {}
