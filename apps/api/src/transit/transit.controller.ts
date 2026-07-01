import { Controller, Get, Headers } from '@nestjs/common';
import { TransitService } from './transit.service';
import { BusDeparture } from '@shiftmate/types';

@Controller('transit')
export class TransitController {
  constructor(private readonly transitService: TransitService) {}

  @Get('departures')
  departures(@Headers('x-device-id') deviceId: string): Promise<BusDeparture[]> {
    return this.transitService.getDepartures(deviceId ?? '');
  }
}
