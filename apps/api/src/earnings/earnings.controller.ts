import { Controller, Get, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { EarningsService } from './earnings.service';
import { FortnightSummary, DashboardData } from '@shiftmate/types';
import { fortnightSummarySchema, dashboardSchema } from '../swagger';

@ApiTags('earnings')
@Controller('earnings')
export class EarningsController {
  constructor(private readonly earningsService: EarningsService) {}

  @Get('current')
  @ApiOperation({ summary: 'Summary for the current fortnight' })
  @ApiOkResponse({ schema: fortnightSummarySchema })
  current(@Headers('x-device-id') deviceId: string): Promise<FortnightSummary> {
    return this.earningsService.currentFortnight(deviceId ?? '');
  }

  @Get('history')
  @ApiOperation({ summary: 'Past fortnight summaries (newest first)' })
  @ApiOkResponse({ schema: { type: 'array', items: fortnightSummarySchema } })
  history(@Headers('x-device-id') deviceId: string): Promise<FortnightSummary[]> {
    return this.earningsService.history(deviceId ?? '');
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Dashboard aggregates (charts + current fortnight)' })
  @ApiOkResponse({ schema: dashboardSchema })
  dashboard(@Headers('x-device-id') deviceId: string): Promise<DashboardData> {
    return this.earningsService.dashboard(deviceId ?? '');
  }
}
