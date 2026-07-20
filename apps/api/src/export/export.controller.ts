import { BadRequestException, Controller, Get, Header, Query, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiQuery } from '@nestjs/swagger';
import type { Response } from 'express';
import { ExportService } from './export.service';
import { CurrentAuthContext } from '../auth/auth-context.decorator';
import { AuthContext } from '../auth/auth-context';

@ApiTags('import/export')
@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('shifts')
  @ApiOperation({ summary: 'Export all shifts as a CSV attachment' })
  @ApiOkResponse({
    description: 'CSV file (Date, Start, End, Hours, Gross Pay, Notes)',
    content: { 'text/csv': { schema: { type: 'string' } } },
  })
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="shiftmate-shifts.csv"')
  shifts(@CurrentAuthContext() authCtx: AuthContext): Promise<string> {
    return this.exportService.shiftsCsv(authCtx);
  }

  @Get('fortnight')
  @ApiOperation({
    summary: "One fortnight's shifts as a headerless tab-separated timesheet block",
  })
  @ApiQuery({ name: 'start', example: '2026-07-06', description: 'Fortnight start (YYYY-MM-DD)' })
  @ApiQuery({ name: 'end', example: '2026-07-19', description: 'Fortnight end (YYYY-MM-DD)' })
  @ApiOkResponse({
    description: 'Rows of "DD/MM/YYYY\\tWeekday\\th:mm am/pm\\th:mm am/pm"',
    content: { 'text/tab-separated-values': { schema: { type: 'string' } } },
  })
  @Header('Content-Type', 'text/tab-separated-values; charset=utf-8')
  fortnight(
    @CurrentAuthContext() authCtx: AuthContext,
    @Query('start') start: string,
    @Query('end') end: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<string> {
    const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
    if (!ISO_DATE.test(start ?? '') || !ISO_DATE.test(end ?? '')) {
      throw new BadRequestException('start and end must be YYYY-MM-DD dates.');
    }
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="shiftmate-timesheet-${start}.tsv"`,
    );
    return this.exportService.fortnightTimesheet(authCtx, start, end);
  }
}
