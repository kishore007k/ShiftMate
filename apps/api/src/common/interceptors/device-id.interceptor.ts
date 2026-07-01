import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import type { Request } from 'express';

@Injectable()
export class DeviceIdInterceptor implements NestInterceptor {
  private readonly logger = new Logger(DeviceIdInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const deviceId = request.headers['x-device-id'];

    if (deviceId) {
      this.logger.verbose(`X-Device-ID: ${String(deviceId)}`);
    }

    return next.handle();
  }
}
