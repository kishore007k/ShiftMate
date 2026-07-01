import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShiftEntity } from './shift.entity';
import { Shift, CreateShiftDto, UpdateShiftDto } from '@shiftmate/types';
import { SettingsService } from '../settings/settings.service';

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

  async findAll(deviceId: string): Promise<Shift[]> {
    const entities = await this.shiftRepo.find({
      where: { deviceId },
      order: { date: 'DESC', startTime: 'DESC' },
    });
    return entities.map((e) => this.toDto(e));
  }

  async findOne(deviceId: string, id: string): Promise<Shift> {
    const entity = await this.shiftRepo.findOne({ where: { id, deviceId } });
    if (!entity) throw new NotFoundException(`Shift ${id} not found`);
    return this.toDto(entity);
  }

  async create(deviceId: string, dto: CreateShiftDto): Promise<Shift> {
    const { hourlyRate } = await this.settingsService.get(deviceId);
    const hoursWorked = computeHours(dto.startTime, dto.endTime);
    const grossPay = Math.round(hoursWorked * hourlyRate * 100) / 100;

    const entity = this.shiftRepo.create({
      deviceId,
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

  async update(deviceId: string, id: string, dto: UpdateShiftDto): Promise<Shift> {
    const entity = await this.shiftRepo.findOne({ where: { id, deviceId } });
    if (!entity) throw new NotFoundException(`Shift ${id} not found`);

    if (dto.date) entity.date = dto.date;
    if (dto.notes !== undefined) entity.notes = dto.notes;

    const startTime = dto.startTime ?? entity.startTime;
    const endTime = dto.endTime ?? entity.endTime;

    if (dto.startTime || dto.endTime) {
      entity.startTime = startTime;
      entity.endTime = endTime;
      const { hourlyRate } = await this.settingsService.get(deviceId);
      entity.hoursWorked = computeHours(startTime, endTime);
      entity.grossPay = Math.round(entity.hoursWorked * hourlyRate * 100) / 100;
    }

    await this.shiftRepo.save(entity);
    return this.toDto(entity);
  }

  async remove(deviceId: string, id: string): Promise<void> {
    const entity = await this.shiftRepo.findOne({ where: { id, deviceId } });
    if (!entity) throw new NotFoundException(`Shift ${id} not found`);
    await this.shiftRepo.remove(entity);
  }

  private toDto(entity: ShiftEntity): Shift {
    return {
      id: entity.id,
      deviceId: entity.deviceId,
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
