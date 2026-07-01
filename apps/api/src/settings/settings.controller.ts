import { Controller, Get, Patch, Body, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiBody } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UserSettings } from '@shiftmate/types';
import { userSettingsSchema } from '../swagger';

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get device settings (defaults if none saved yet)' })
  @ApiOkResponse({ schema: userSettingsSchema })
  get(@Headers('x-device-id') deviceId: string): Promise<UserSettings> {
    return this.settingsService.get(deviceId ?? '');
  }

  @Patch()
  @ApiOperation({ summary: 'Update device settings (partial; merges over existing)' })
  @ApiBody({ schema: userSettingsSchema })
  @ApiOkResponse({ schema: userSettingsSchema })
  patch(
    @Headers('x-device-id') deviceId: string,
    @Body() body: Partial<UserSettings>,
  ): Promise<UserSettings> {
    return this.settingsService.patch(deviceId ?? '', body);
  }
}
