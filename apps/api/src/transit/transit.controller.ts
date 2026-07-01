import { Controller, Get, Headers } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiServiceUnavailableResponse,
} from '@nestjs/swagger';
import { TransitService } from './transit.service';
import { BusDeparture } from '@shiftmate/types';
import { busDepartureSchema } from '../swagger';

@ApiTags('transit')
@Controller('transit')
export class TransitController {
  constructor(private readonly transitService: TransitService) {}

  @Get('departures')
  @ApiOperation({ summary: 'Bus departures from home to work for the next shift' })
  @ApiOkResponse({ schema: { type: 'array', items: busDepartureSchema } })
  @ApiBadRequestResponse({ description: 'Home address not set in settings' })
  @ApiServiceUnavailableResponse({ description: 'GOOGLE_MAPS_API_KEY not configured on the server' })
  departures(@Headers('x-device-id') deviceId: string): Promise<BusDeparture[]> {
    return this.transitService.getDepartures(deviceId ?? '');
  }
}
