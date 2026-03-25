import { Module } from '@nestjs/common';
import { AgenticFilesystemModule } from '../agentic-filesystem/agentic-filesystem.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { UserService } from './user.service';
import { SessionService } from './session.service';

@Module({
  imports: [AgenticFilesystemModule],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, UserService, SessionService],
  exports: [AuthService, AuthGuard, UserService, SessionService],
})
export class AuthModule {}
