import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SettingsEntity } from './settings.entity';
import { UserSettings } from '@shiftmate/types';
import { AuthContext } from '../auth/auth-context';

const DEFAULTS: UserSettings = {
  hourlyRate: 21,
  fortnightStart: '2025-01-06',
  taxBracket: 'auto',
  transitPreference: 'google',
  workplaceAddress: '793 High Street, Epping VIC 3076',
  homeAddress: '',
};

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(SettingsEntity)
    private readonly repo: Repository<SettingsEntity>,
  ) {}

  async get(authCtx: AuthContext): Promise<UserSettings> {
    const entity = await this.findEntity(authCtx);
    return entity ? this.toDto(entity) : { ...DEFAULTS };
  }

  async patch(authCtx: AuthContext, dto: Partial<UserSettings>): Promise<UserSettings> {
    const existing = await this.findEntity(authCtx);
    if (existing) {
      // First authenticated write against this device's still-unclaimed row: it becomes ours.
      if (authCtx.userId && !existing.userId) existing.userId = authCtx.userId;
      Object.assign(existing, dto);
      await this.repo.save(existing);
      return this.toDto(existing);
    }
    const created = this.repo.create({
      deviceId: authCtx.deviceId,
      userId: authCtx.userId,
      ...DEFAULTS,
      ...dto,
    });
    await this.repo.save(created);
    return this.toDto(created);
  }

  /** Prefer the row already linked to this user; otherwise fall back to this device's own row —
   * but only if that row isn't already claimed by a *different* signed-in user (e.g. a shared
   * computer). Never leak or hijack another account's settings. */
  private async findEntity(authCtx: AuthContext): Promise<SettingsEntity | null> {
    if (authCtx.userId) {
      const byUser = await this.repo.findOne({ where: { userId: authCtx.userId } });
      if (byUser) return byUser;
      const byDevice = await this.repo.findOne({ where: { deviceId: authCtx.deviceId } });
      return byDevice && !byDevice.userId ? byDevice : null;
    }
    return this.repo.findOne({ where: { deviceId: authCtx.deviceId } });
  }

  private toDto(e: SettingsEntity): UserSettings {
    return {
      userId: e.userId,
      hourlyRate: Number(e.hourlyRate),
      fortnightStart: e.fortnightStart,
      taxBracket: e.taxBracket as UserSettings['taxBracket'],
      transitPreference: e.transitPreference as UserSettings['transitPreference'],
      workplaceAddress: e.workplaceAddress,
      homeAddress: e.homeAddress,
    };
  }
}
