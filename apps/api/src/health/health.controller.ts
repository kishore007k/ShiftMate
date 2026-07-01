import { Controller, Get, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { healthSchema } from '../swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Get()
  @ApiOperation({ summary: 'Liveness check with database status' })
  @ApiOkResponse({ schema: healthSchema })
  async check(): Promise<{ status: string; timestamp: string; db: string }> {
    let dbStatus = 'disconnected';

    try {
      await this.dataSource.query('SELECT 1');
      dbStatus = 'connected';
    } catch (err: unknown) {
      this.logger.error('DB health check failed', err);
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      db: dbStatus,
    };
  }
}
