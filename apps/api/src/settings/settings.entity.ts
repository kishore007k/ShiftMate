import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('user_settings')
export class SettingsEntity {
  @PrimaryColumn({ name: 'device_id', type: 'text' })
  deviceId!: string;

  @Column({ name: 'hourly_rate', type: 'numeric', precision: 8, scale: 2 })
  hourlyRate!: number;

  @Column({ name: 'fortnight_start', type: 'date' })
  fortnightStart!: string;

  @Column({ name: 'tax_bracket', type: 'text', default: 'auto' })
  taxBracket!: string;

  @Column({ name: 'transit_preference', type: 'text', default: 'google' })
  transitPreference!: string;

  @Column({ name: 'workplace_address', type: 'text', default: '793 High Street, Epping VIC 3076' })
  workplaceAddress!: string;

  @Column({ name: 'home_address', type: 'text', default: '' })
  homeAddress!: string;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
