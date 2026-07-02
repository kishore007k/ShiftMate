import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { ShiftEntity } from './shift.entity';
import { Shift, CreateShiftDto, UpdateShiftDto } from '@shiftmate/types';
import { SettingsService } from '../settings/settings.service';
import { AuthContext, partitionWhere } from '../auth/auth-context';

function computeHours(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let endMins = eh * 60 + em;
  const startMins = sh * 60 + sm;
  if (endMins <= startMins) endMins += 24 * 60; // overnight shift
  return Math.round(((endMins - startMins) / 60) * 100) / 100;
}

@Injectable()
export class ShiftsService {
  constructor(
    @InjectRepository(ShiftEntity)
    private readonly shiftRepo: Repository<ShiftEntity>,
    private readonly settingsService: SettingsService,
  ) {}

  async findAll(authCtx: AuthContext): Promise<Shift[]> {
    const entities = await this.shiftRepo.find({
      where: partitionWhere(authCtx),
      order: { date: 'DESC', startTime: 'DESC' },
    });
    return entities.map((e) => this.toDto(e));
  }

  async findOne(authCtx: AuthContext, id: string): Promise<Shift> {
    const entity = await this.shiftRepo.findOne({ where: { id, ...partitionWhere(authCtx) } });
    if (!entity) throw new NotFoundException(`Shift ${id} not found`);
    return this.toDto(entity);
  }

  async create(authCtx: AuthContext, dto: CreateShiftDto): Promise<Shift> {
    const { hourlyRate } = await this.settingsService.get(authCtx);
    const hoursWorked = computeHours(dto.startTime, dto.endTime);
    const grossPay = Math.round(hoursWorked * hourlyRate * 100) / 100;

    const entity = this.shiftRepo.create({
      deviceId: authCtx.deviceId,
      userId: authCtx.userId,
      date: dto.date,
      startTime: dto.startTime,
      endTime: dto.endTime,
      hoursWorked,
      grossPay,
      notes: dto.notes,
    });
    await this.shiftRepo.save(entity);
    return this.toDto(entity);
  }

  async update(authCtx: AuthContext, id: string, dto: UpdateShiftDto): Promise<Shift> {
    const entity = await this.shiftRepo.findOne({ where: { id, ...partitionWhere(authCtx) } });
    if (!entity) throw new NotFoundException(`Shift ${id} not found`);

    if (dto.date) entity.date = dto.date;
    if (dto.notes !== undefined) entity.notes = dto.notes;

    const startTime = dto.startTime ?? entity.startTime;
    const endTime = dto.endTime ?? entity.endTime;

    if (dto.startTime || dto.endTime) {
      entity.startTime = startTime;
      entity.endTime = endTime;
      const { hourlyRate } = await this.settingsService.get(authCtx);
      entity.hoursWorked = computeHours(startTime, endTime);
      entity.grossPay = Math.round(entity.hoursWorked * hourlyRate * 100) / 100;
    }

    await this.shiftRepo.save(entity);
    return this.toDto(entity);
  }

  async remove(authCtx: AuthContext, id: string): Promise<void> {
    const entity = await this.shiftRepo.findOne({ where: { id, ...partitionWhere(authCtx) } });
    if (!entity) throw new NotFoundException(`Shift ${id} not found`);
    await this.shiftRepo.remove(entity);
  }

  /** Links this device's still-unclaimed shift history to the signed-in user. An explicit,
   * user-initiated action (unlike settings' auto-claim) — shift history is consequential
   * enough to ask first. Returns the number of shifts claimed. */
  async claimForCurrentUser(authCtx: AuthContext): Promise<number> {
    if (!authCtx.userId) return 0;
    const result = await this.shiftRepo.update(
      { deviceId: authCtx.deviceId, userId: IsNull() },
      { userId: authCtx.userId },
    );
    return result.affected ?? 0;
  }

  private toDto(entity: ShiftEntity): Shift {
    return {
      id: entity.id,
      deviceId: entity.deviceId,
      userId: entity.userId,
      date: entity.date,
      startTime: entity.startTime,
      endTime: entity.endTime,
      hoursWorked: Number(entity.hoursWorked),
      grossPay: Number(entity.grossPay),
      notes: entity.notes,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
