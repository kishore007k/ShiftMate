import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { ShiftsModule } from './shifts/shifts.module';
import { SettingsModule } from './settings/settings.module';
import { EarningsModule } from './earnings/earnings.module';
import { TransitModule } from './transit/transit.module';
import { ExportModule } from './export/export.module';
import { ImportModule } from './import/import.module';
import { AuthModule } from './auth/auth.module';
import { DeviceIdInterceptor } from './common/interceptors/device-id.interceptor';
import { OptionalAuthGuard } from './common/guards/optional-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Repo-root env files hold the shared secrets (DB, JWT, OAuth); apps/api/.env is kept
      // as a fallback for anything not migrated there yet. Earlier files win on key conflicts.
      envFilePath:
        process.env.NODE_ENV === 'production' ? ['../../.env.prod', '.env'] : ['../../.env', '.env'],
    }),
    DatabaseModule,
    HealthModule,
    ShiftsModule,
    SettingsModule,
    EarningsModule,
    TransitModule,
    ExportModule,
    ImportModule,
    AuthModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: DeviceIdInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: OptionalAuthGuard,
    },
  ],
})
export class AppModule {}
