import { Module } from '@nestjs/common';
import { TransitController } from './transit.controller';
import { TransitService } from './transit.service';
import { SettingsModule } from '../settings/settings.module';
import { ShiftsModule } from '../shifts/shifts.module';

@Module({
  imports: [SettingsModule, ShiftsModule],
  controllers: [TransitController],
  providers: [TransitService],
})
export class TransitModule {}
