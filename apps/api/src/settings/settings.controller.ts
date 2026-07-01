import { Controller, Get, Patch, Body, Headers } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UserSettings } from '@shiftmate/types';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  get(@Headers('x-device-id') deviceId: string): Promise<UserSettings> {
    return this.settingsService.get(deviceId ?? '');
  }

  @Patch()
  patch(
    @Headers('x-device-id') deviceId: string,
    @Body() body: Partial<UserSettings>,
  ): Promise<UserSettings> {
    return this.settingsService.patch(deviceId ?? '', body);
  }
}
