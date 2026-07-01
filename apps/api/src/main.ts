import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);
  const port = config.get<number>('PORT', 3000);
  const logger = new Logger('Bootstrap');

  app.setGlobalPrefix('api');

  // Explicit allowlist (WEB_ORIGIN may be a comma-separated list; trailing slashes ignored).
  const allowlist = [
    'http://localhost:3001',
    ...config
      .get<string>('WEB_ORIGIN', '')
      .split(',')
      .map((o) => o.trim().replace(/\/+$/, ''))
      .filter(Boolean),
  ];
  // Deploy-platform subdomains are allowed too, so a missing/mistyped WEB_ORIGIN doesn't
  // hard-block the app (data is still scoped by the x-device-id header, not cookies).
  const allowedHostPatterns = [/\.onrender\.com$/, /\.fly\.dev$/, /\.vercel\.app$/];

  app.enableCors({
    origin: (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => {
      if (!origin) return cb(null, true); // non-browser / same-origin requests
      let host = '';
      try {
        host = new URL(origin).hostname;
      } catch {
        /* malformed origin */
      }
      const ok =
        allowlist.includes(origin.replace(/\/+$/, '')) ||
        allowedHostPatterns.some((re) => re.test(host));
      cb(null, ok);
    },
    credentials: true,
  });
  logger.log(`CORS allowlist: ${allowlist.join(', ')} (+ *.onrender.com, *.fly.dev, *.vercel.app)`);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('ShiftMate API')
    .setDescription(
      'Shift tracking, earnings, transit and CSV import/export. Every request is scoped by the `x-device-id` header.',
    )
    .setVersion('1.0')
    .addGlobalParameters({
      name: 'x-device-id',
      in: 'header',
      required: false,
      description: 'Per-device identifier that scopes all data.',
      schema: { type: 'string', example: 'a1b2c3d4' },
    })
    .addTag('shifts', 'Create, read, update and delete shifts')
    .addTag('earnings', 'Fortnight summaries and dashboard aggregates')
    .addTag('settings', 'Per-device preferences (pay, tax, addresses)')
    .addTag('transit', 'Bus departures via Google Directions')
    .addTag('import/export', 'CSV import and export')
    .addTag('health', 'Liveness and database status')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, { jsonDocumentUrl: 'api/docs-json' });

  await app.listen(port);
  logger.log(`API listening on port ${port}`);
}

bootstrap().catch((err: unknown) => {
  const logger = new Logger('Bootstrap');
  logger.error('Failed to start', err);
  process.exit(1);
});
