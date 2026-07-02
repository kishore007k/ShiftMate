import { Controller, Get, Patch, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiBody } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UserSettings } from '@shiftmate/types';
import { userSettingsSchema } from '../swagger';
import { CurrentAuthContext } from '../auth/auth-context.decorator';
import { AuthContext } from '../auth/auth-context';

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get device settings (defaults if none saved yet)' })
  @ApiOkResponse({ schema: userSettingsSchema })
  get(@CurrentAuthContext() authCtx: AuthContext): Promise<UserSettings> {
    return this.settingsService.get(authCtx);
  }

  @Patch()
  @ApiOperation({ summary: 'Update device settings (partial; merges over existing)' })
  @ApiBody({ schema: userSettingsSchema })
  @ApiOkResponse({ schema: userSettingsSchema })
  patch(
    @CurrentAuthContext() authCtx: AuthContext,
    @Body() body: Partial<UserSettings>,
  ): Promise<UserSettings> {
    return this.settingsService.patch(authCtx, body);
  }
}
