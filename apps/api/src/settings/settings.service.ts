import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SettingsEntity } from './settings.entity';
import { UserSettings } from '@shiftmate/types';

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

  async get(deviceId: string): Promise<UserSettings> {
    const entity = await this.repo.findOne({ where: { deviceId } });
    return entity ? this.toDto(entity) : { ...DEFAULTS };
  }

  async patch(deviceId: string, dto: Partial<UserSettings>): Promise<UserSettings> {
    const existing = await this.repo.findOne({ where: { deviceId } });
    if (existing) {
      Object.assign(existing, dto);
      await this.repo.save(existing);
      return this.toDto(existing);
    }
    const created = this.repo.create({ deviceId, ...DEFAULTS, ...dto });
    await this.repo.save(created);
    return this.toDto(created);
  }

  private toDto(e: SettingsEntity): UserSettings {
    return {
      hourlyRate: Number(e.hourlyRate),
      fortnightStart: e.fortnightStart,
      taxBracket: e.taxBracket as UserSettings['taxBracket'],
      transitPreference: e.transitPreference as UserSettings['transitPreference'],
      workplaceAddress: e.workplaceAddress,
      homeAddress: e.homeAddress,
    };
  }
}
