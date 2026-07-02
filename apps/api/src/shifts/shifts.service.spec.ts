import { NotFoundException } from '@nestjs/common';
import { ShiftsService } from './shifts.service';
import { ShiftEntity } from './shift.entity';
import { SettingsService } from '../settings/settings.service';

function matches(s: ShiftEntity, where: any): boolean {
  if (where.id !== undefined && s.id !== where.id) return false;
  if ('userId' in where) return s.userId === where.userId;
  if ('deviceId' in where) return s.deviceId === where.deviceId;
  return true;
}

// In-memory fake repo covering the methods ShiftsService uses.
function makeRepo() {
  const store: ShiftEntity[] = [];
  return {
    store,
    find: jest.fn(async ({ where }: any) =>
      store
        .filter((s) => matches(s, where))
        .sort((a, b) =>
          b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime),
        ),
    ),
    findOne: jest.fn(async ({ where }: any) => store.find((s) => matches(s, where)) ?? null),
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
    // Only used by claimForCurrentUser, which always calls it with { deviceId, userId: IsNull() }.
    update: jest.fn(async (criteria: { deviceId: string }, partial: { userId: string }) => {
      let affected = 0;
      for (const s of store) {
        if (s.deviceId === criteria.deviceId && !s.userId) {
          s.userId = partial.userId;
          affected++;
        }
      }
      return { affected };
    }),
  };
}

describe('ShiftsService', () => {
  let repo: ReturnType<typeof makeRepo>;
  let settings: SettingsService;
  let service: ShiftsService;
  const DEVICE = { deviceId: 'device-1' };

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
    await expect(
      service.findOne({ deviceId: 'other-device' }, created.id),
    ).rejects.toBeInstanceOf(NotFoundException);
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
    await service.create({ deviceId: 'other' }, { date: '2025-06-02', startTime: '09:00', endTime: '17:00' });
    const all = await service.findAll(DEVICE);
    expect(all).toHaveLength(2);
    expect(all[0].date).toBe('2025-06-03');
  });

  describe('authenticated access', () => {
    it('findAll scopes by userId once signed in, ignoring deviceId', async () => {
      await service.create({ deviceId: 'device-1', userId: 'user-1' }, {
        date: '2025-06-01',
        startTime: '09:00',
        endTime: '17:00',
      });
      // Same user, different device (e.g. mobile) — should still see the shift.
      const all = await service.findAll({ deviceId: 'device-2', userId: 'user-1' });
      expect(all).toHaveLength(1);
    });

    it('isolates shifts between two signed-in users', async () => {
      await service.create({ deviceId: 'd', userId: 'user-1' }, {
        date: '2025-06-01',
        startTime: '09:00',
        endTime: '17:00',
      });
      const forOtherUser = await service.findAll({ deviceId: 'd', userId: 'user-2' });
      expect(forOtherUser).toHaveLength(0);
    });
  });

  describe('claimForCurrentUser', () => {
    it('does nothing when not authenticated', async () => {
      await service.create(DEVICE, { date: '2025-06-01', startTime: '09:00', endTime: '17:00' });
      const claimed = await service.claimForCurrentUser(DEVICE);
      expect(claimed).toBe(0);
    });

    it('links this device’s unclaimed shifts to the signed-in user', async () => {
      await service.create(DEVICE, { date: '2025-06-01', startTime: '09:00', endTime: '17:00' });
      await service.create(DEVICE, { date: '2025-06-02', startTime: '09:00', endTime: '17:00' });

      const claimed = await service.claimForCurrentUser({ ...DEVICE, userId: 'user-1' });
      expect(claimed).toBe(2);

      const all = await service.findAll({ ...DEVICE, userId: 'user-1' });
      expect(all).toHaveLength(2);
    });

    it('does not reclaim shifts already linked to a different user', async () => {
      await service.create({ ...DEVICE, userId: 'user-1' }, {
        date: '2025-06-01',
        startTime: '09:00',
        endTime: '17:00',
      });
      const claimed = await service.claimForCurrentUser({ ...DEVICE, userId: 'user-2' });
      expect(claimed).toBe(0);
    });
  });
});
