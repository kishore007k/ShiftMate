import { Body, Controller, Headers, Post } from '@nestjs/common';
import { ImportService, ImportResult } from './import.service';

@Controller('import')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post('shifts')
  shifts(
    @Headers('x-device-id') deviceId: string,
    @Body() body: { csv?: string },
  ): Promise<ImportResult> {
    return this.importService.importCsv(deviceId ?? '', body.csv ?? '');
  }
}
