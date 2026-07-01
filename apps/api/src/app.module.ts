import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { ShiftsModule } from './shifts/shifts.module';
import { SettingsModule } from './settings/settings.module';
import { EarningsModule } from './earnings/earnings.module';
import { TransitModule } from './transit/transit.module';
import { ExportModule } from './export/export.module';
import { ImportModule } from './import/import.module';
import { DeviceIdInterceptor } from './common/interceptors/device-id.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    HealthModule,
    ShiftsModule,
    SettingsModule,
    EarningsModule,
    TransitModule,
    ExportModule,
    ImportModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: DeviceIdInterceptor,
    },
  ],
})
export class AppModule {}
