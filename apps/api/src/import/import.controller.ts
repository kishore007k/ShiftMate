import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiCreatedResponse } from '@nestjs/swagger';
import { ImportService, ImportResult } from './import.service';
import { importBodySchema, importResultSchema } from '../swagger';
import { CurrentAuthContext } from '../auth/auth-context.decorator';
import { AuthContext } from '../auth/auth-context';

@ApiTags('import/export')
@Controller('import')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post('shifts')
  @ApiOperation({ summary: 'Import shifts from CSV (duplicates reported as conflicts)' })
  @ApiBody({ schema: importBodySchema })
  @ApiCreatedResponse({ schema: importResultSchema })
  shifts(
    @CurrentAuthContext() authCtx: AuthContext,
    @Body() body: { csv?: string },
  ): Promise<ImportResult> {
    return this.importService.importCsv(authCtx, body.csv ?? '');
  }
}
