import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class AngularSsrMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AngularSsrMiddleware.name);
  private angularApp: any;

  async use(req: Request, res: Response, next: NextFunction) {
    // Skip API routes
    if (req.originalUrl.startsWith('/api')) {
      return next();
    }

    try {
      if (!this.angularApp) {
        const { AngularNodeAppEngine } = await import('@angular/ssr/node');
        this.angularApp = new AngularNodeAppEngine();
      }

      const response = await this.angularApp.handle(req);
      if (response) {
        const { writeResponseToNodeResponse } = await import(
          '@angular/ssr/node'
        );
        await writeResponseToNodeResponse(response, res);
      } else {
        next();
      }
    } catch (error) {
      this.logger.error('Angular SSR rendering failed', error);
      next();
    }
  }
}
