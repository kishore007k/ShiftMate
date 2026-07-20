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
    summary: "One fortnight's shifts as a headerless timesheet (TSV block or CSV with formulas)",
  })
  @ApiQuery({ name: 'start', example: '2026-07-06', description: 'Fortnight start (YYYY-MM-DD)' })
  @ApiQuery({ name: 'end', example: '2026-07-19', description: 'Fortnight end (YYYY-MM-DD)' })
  @ApiQuery({
    name: 'format',
    required: false,
    enum: ['tsv', 'csv'],
    description: 'tsv (default): paste-into-Excel block. csv: adds Hours formulas + total row.',
  })
  @ApiOkResponse({
    description:
      'Rows of DD/MM/YYYY, weekday, h:mm am/pm start and end; csv adds "=MOD(Dn-Cn,1)*24" Hours and a =SUM total row',
    content: {
      'text/tab-separated-values': { schema: { type: 'string' } },
      'text/csv': { schema: { type: 'string' } },
    },
  })
  fortnight(
    @CurrentAuthContext() authCtx: AuthContext,
    @Query('start') start: string,
    @Query('end') end: string,
    @Res({ passthrough: true }) res: Response,
    @Query('format') format?: string,
  ): Promise<string> {
    const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
    if (!ISO_DATE.test(start ?? '') || !ISO_DATE.test(end ?? '')) {
      throw new BadRequestException('start and end must be YYYY-MM-DD dates.');
    }
    if (format !== undefined && format !== 'tsv' && format !== 'csv') {
      throw new BadRequestException('format must be "tsv" or "csv".');
    }
    const fmt = format ?? 'tsv';
    res.setHeader(
      'Content-Type',
      fmt === 'csv' ? 'text/csv; charset=utf-8' : 'text/tab-separated-values; charset=utf-8',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="shiftmate-timesheet-${start}.${fmt}"`,
    );
    return this.exportService.fortnightTimesheet(authCtx, start, end, fmt);
  }
}
