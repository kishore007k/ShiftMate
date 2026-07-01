import { Controller, Get, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Get()
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
