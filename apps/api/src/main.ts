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

  app.enableCors({
    origin: [
      'http://localhost:3001',
      config.get<string>('WEB_ORIGIN', 'http://localhost:3001'),
    ],
    credentials: true,
  });

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
