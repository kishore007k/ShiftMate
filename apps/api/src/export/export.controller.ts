import { Controller, Get, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
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
}
