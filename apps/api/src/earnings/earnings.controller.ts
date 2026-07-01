import { Controller, Get, Headers } from '@nestjs/common';
import { EarningsService } from './earnings.service';
import { FortnightSummary, DashboardData } from '@shiftmate/types';

@Controller('earnings')
export class EarningsController {
  constructor(private readonly earningsService: EarningsService) {}

  @Get('current')
  current(@Headers('x-device-id') deviceId: string): Promise<FortnightSummary> {
    return this.earningsService.currentFortnight(deviceId ?? '');
  }

  @Get('history')
  history(@Headers('x-device-id') deviceId: string): Promise<FortnightSummary[]> {
    return this.earningsService.history(deviceId ?? '');
  }

  @Get('dashboard')
  dashboard(@Headers('x-device-id') deviceId: string): Promise<DashboardData> {
    return this.earningsService.dashboard(deviceId ?? '');
  }
}
