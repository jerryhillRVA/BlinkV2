import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AngularSsrMiddleware } from './angular-ssr.middleware';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(
        __dirname,
        '..',
        '..',
        '..',
        'dist',
        'apps',
        'blinksocial-web',
        'browser'
      ),
      serveRoot: '/',
      serveStaticOptions: {
        index: false,
        maxAge: '1y',
        redirect: false,
      },
    }),
  ],
})
export class AngularSsrModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AngularSsrMiddleware).forRoutes('*');
  }
}
