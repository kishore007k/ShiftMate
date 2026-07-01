import { Module } from '@nestjs/common';
import { EarningsController } from './earnings.controller';
import { EarningsService } from './earnings.service';
import { ShiftsModule } from '../shifts/shifts.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [ShiftsModule, SettingsModule],
  controllers: [EarningsController],
  providers: [EarningsService],
})
export class EarningsModule {}
