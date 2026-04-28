import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { join } from 'path';

@Injectable()
export class AngularSsrMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AngularSsrMiddleware.name);
  private reqHandler: ((req: Request, res: Response, next: NextFunction) => Promise<void>) | null = null;
  private readonly isDev = process.env['NODE_ENV'] !== 'production';

  async use(req: Request, res: Response, next: NextFunction) {
    // In development Angular is served by its own dev server — skip SSR entirely
    if (this.isDev) {
      return next();
    }

    // Skip API routes
    if (req.originalUrl.startsWith('/api')) {
      return next();
    }

    try {
      if (!this.reqHandler) {
        // Load the pre-built Angular server bundle (produced by `nx build blinksocial-web`)
        const serverBundlePath = join(
          __dirname,
          '..',
          '..',
          '..',
          'dist',
          'apps',
          'blinksocial-web',
          'server',
          'server.mjs'
        );
        const serverBundle = await import(serverBundlePath);
        // reqHandler is a createNodeRequestHandler-wrapped Express app — use it directly
        this.reqHandler = serverBundle.reqHandler;
      }

      const handler = this.reqHandler;
      if (!handler) {
        throw new Error('Angular SSR request handler failed to load');
      }
      await handler(req, res, next);
    } catch (error) {
      this.logger.error('Angular SSR rendering failed', error);
      next();
    }
  }
}
