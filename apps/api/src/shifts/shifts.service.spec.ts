import { NotFoundException } from '@nestjs/common';
import { ShiftsService } from './shifts.service';
import { ShiftEntity } from './shift.entity';
import { SettingsService } from '../settings/settings.service';

// In-memory fake repo covering the methods ShiftsService uses.
function makeRepo() {
  const store: ShiftEntity[] = [];
  return {
    store,
    find: jest.fn(async ({ where }: any) =>
      store
        .filter((s) => s.deviceId === where.deviceId)
        .sort((a, b) =>
          b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime),
        ),
    ),
    findOne: jest.fn(async ({ where }: any) =>
      store.find((s) => s.id === where.id && s.deviceId === where.deviceId) ?? null,
    ),
    create: jest.fn((data: Partial<ShiftEntity>) => {
      const now = new Date();
      return {
        id: `id-${store.length + 1}`,
        createdAt: now,
        updatedAt: now,
        ...data,
      } as ShiftEntity;
    }),
    save: jest.fn(async (e: ShiftEntity) => {
      const idx = store.findIndex((s) => s.id === e.id);
      if (idx >= 0) store[idx] = e;
      else store.push(e);
      return e;
    }),
    remove: jest.fn(async (e: ShiftEntity) => {
      const idx = store.findIndex((s) => s.id === e.id);
      if (idx >= 0) store.splice(idx, 1);
      return e;
    }),
  };
}

describe('ShiftsService', () => {
  let repo: ReturnType<typeof makeRepo>;
  let settings: SettingsService;
  let service: ShiftsService;
  const DEVICE = 'device-1';

  beforeEach(() => {
    repo = makeRepo();
    settings = { get: jest.fn(async () => ({ hourlyRate: 25 })) } as unknown as SettingsService;
    service = new ShiftsService(repo as any, settings);
  });

  it('computes hours and gross pay on create', async () => {
    const shift = await service.create(DEVICE, {
      date: '2025-06-01',
      startTime: '09:00',
      endTime: '17:00',
    });
    expect(shift.hoursWorked).toBe(8);
    expect(shift.grossPay).toBe(200); // 8h * $25
  });

  it('handles overnight shifts crossing midnight', async () => {
    const shift = await service.create(DEVICE, {
      date: '2025-06-01',
      startTime: '22:00',
      endTime: '06:00',
    });
    expect(shift.hoursWorked).toBe(8);
    expect(shift.grossPay).toBe(200);
  });

  it('rounds partial hours to 2 decimals', async () => {
    const shift = await service.create(DEVICE, {
      date: '2025-06-01',
      startTime: '09:00',
      endTime: '12:30',
    });
    expect(shift.hoursWorked).toBe(3.5);
    expect(shift.grossPay).toBe(87.5);
  });

  it('findOne throws NotFound for unknown id', async () => {
    await expect(service.findOne(DEVICE, 'nope')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('scopes findOne by deviceId', async () => {
    const created = await service.create(DEVICE, {
      date: '2025-06-01',
      startTime: '09:00',
      endTime: '17:00',
    });
    await expect(service.findOne('other-device', created.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('recomputes pay when update changes times', async () => {
    const created = await service.create(DEVICE, {
      date: '2025-06-01',
      startTime: '09:00',
      endTime: '17:00',
    });
    const updated = await service.update(DEVICE, created.id, { endTime: '13:00' });
    expect(updated.hoursWorked).toBe(4);
    expect(updated.grossPay).toBe(100);
  });

  it('leaves pay untouched when update only changes notes', async () => {
    const created = await service.create(DEVICE, {
      date: '2025-06-01',
      startTime: '09:00',
      endTime: '17:00',
    });
    const updated = await service.update(DEVICE, created.id, { notes: 'busy' });
    expect(updated.grossPay).toBe(200);
    expect(updated.notes).toBe('busy');
  });

  it('update throws NotFound for unknown id', async () => {
    await expect(service.update(DEVICE, 'nope', { notes: 'x' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('remove deletes the shift', async () => {
    const created = await service.create(DEVICE, {
      date: '2025-06-01',
      startTime: '09:00',
      endTime: '17:00',
    });
    await service.remove(DEVICE, created.id);
    await expect(service.findOne(DEVICE, created.id)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('remove throws NotFound for unknown id', async () => {
    await expect(service.remove(DEVICE, 'nope')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('findAll returns only the device rows, newest first', async () => {
    await service.create(DEVICE, { date: '2025-06-01', startTime: '09:00', endTime: '17:00' });
    await service.create(DEVICE, { date: '2025-06-03', startTime: '09:00', endTime: '17:00' });
    await service.create('other', { date: '2025-06-02', startTime: '09:00', endTime: '17:00' });
    const all = await service.findAll(DEVICE);
    expect(all).toHaveLength(2);
    expect(all[0].date).toBe('2025-06-03');
  });
});
