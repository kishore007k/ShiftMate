import { Controller, Get, Header, Headers } from '@nestjs/common';
import { ExportService } from './export.service';

@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('shifts')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="shiftmate-shifts.csv"')
  shifts(@Headers('x-device-id') deviceId: string): Promise<string> {
    return this.exportService.shiftsCsv(deviceId ?? '');
  }
}
