import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type {
  LoginRequestContract,
  AuthStatusResponseContract,
  LoginResponseContract,
} from '@blinksocial/contracts';
import { Public } from './decorators';
import { AuthService } from './auth.service';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: false, // Set to true in production with HTTPS
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Get('status')
  async status(@Req() req: Request): Promise<AuthStatusResponseContract> {
    const needsBootstrap = await this.authService.needsBootstrap();
    const token = req.cookies?.['session_token'];

    if (!token) {
      return { authenticated: false, needsBootstrap, user: null };
    }

    const user = await this.authService.validateSession(token);
    if (!user) {
      return { authenticated: false, needsBootstrap, user: null };
    }

    return {
      authenticated: true,
      needsBootstrap: false,
      user: this.authService.toAuthUserInfo(user),
    };
  }

  @Public()
  @Post('login')
  async login(
    @Body() body: LoginRequestContract,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseContract> {
    const result = await this.authService.authenticate(body.email, body.password);
    if (!result.success || !result.user || !result.token) {
      throw new UnauthorizedException('Invalid email or password');
    }

    res.cookie('session_token', result.token, COOKIE_OPTIONS);

    return {
      user: this.authService.toAuthUserInfo(result.user),
      message: 'Login successful',
    };
  }

  @Public()
  @Post('logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    const token = req.cookies?.['session_token'];
    if (token) {
      await this.authService.logout(token);
    }
    res.clearCookie('session_token', { path: '/' });
    return { message: 'Logged out successfully' };
  }
}
