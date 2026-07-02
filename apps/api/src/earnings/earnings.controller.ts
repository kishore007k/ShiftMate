import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { EarningsService } from './earnings.service';
import { FortnightSummary, DashboardData } from '@shiftmate/types';
import { fortnightSummarySchema, dashboardSchema } from '../swagger';
import { CurrentAuthContext } from '../auth/auth-context.decorator';
import { AuthContext } from '../auth/auth-context';

@ApiTags('earnings')
@Controller('earnings')
export class EarningsController {
  constructor(private readonly earningsService: EarningsService) {}

  @Get('current')
  @ApiOperation({ summary: 'Summary for the current fortnight' })
  @ApiOkResponse({ schema: fortnightSummarySchema })
  current(@CurrentAuthContext() authCtx: AuthContext): Promise<FortnightSummary> {
    return this.earningsService.currentFortnight(authCtx);
  }

  @Get('history')
  @ApiOperation({ summary: 'Past fortnight summaries (newest first)' })
  @ApiOkResponse({ schema: { type: 'array', items: fortnightSummarySchema } })
  history(@CurrentAuthContext() authCtx: AuthContext): Promise<FortnightSummary[]> {
    return this.earningsService.history(authCtx);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Dashboard aggregates (charts + current fortnight)' })
  @ApiOkResponse({ schema: dashboardSchema })
  dashboard(@CurrentAuthContext() authCtx: AuthContext): Promise<DashboardData> {
    return this.earningsService.dashboard(authCtx);
  }
}
