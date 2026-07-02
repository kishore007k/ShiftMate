import { SettingsService } from './settings.service';
import { SettingsEntity } from './settings.entity';

function makeRepo() {
  const store: SettingsEntity[] = [];
  let nextId = 1;
  return {
    store,
    findOne: jest.fn(async ({ where }: any) => {
      if ('userId' in where) return store.find((s) => s.userId === where.userId) ?? null;
      return store.find((s) => s.deviceId === where.deviceId) ?? null;
    }),
    create: jest.fn((data: Partial<SettingsEntity>) => ({ ...data }) as SettingsEntity),
    save: jest.fn(async (e: SettingsEntity) => {
      if (!e.id) e.id = `id-${nextId++}`;
      const idx = store.findIndex((s) => s.id === e.id);
      if (idx >= 0) store[idx] = e;
      else store.push(e);
      return e;
    }),
  };
}

describe('SettingsService', () => {
  let repo: ReturnType<typeof makeRepo>;
  let service: SettingsService;
  const DEVICE = { deviceId: 'device-1' };

  beforeEach(() => {
    repo = makeRepo();
    service = new SettingsService(repo as any);
  });

  it('returns defaults when no row exists (without persisting)', async () => {
    const settings = await service.get(DEVICE);
    expect(settings.transitPreference).toBe('google');
    expect(settings.taxBracket).toBe('auto');
    expect(settings.hourlyRate).toBeGreaterThan(0);
    expect(repo.store).toHaveLength(0);
  });

  it('creates a row on first patch, merging over defaults', async () => {
    const settings = await service.patch(DEVICE, { hourlyRate: 30 });
    expect(settings.hourlyRate).toBe(30);
    expect(settings.transitPreference).toBe('google'); // default preserved
    expect(repo.store).toHaveLength(1);
  });

  it('updates an existing row on subsequent patch', async () => {
    await service.patch(DEVICE, { hourlyRate: 30 });
    const settings = await service.patch(DEVICE, { transitPreference: 'ptv' });
    expect(settings.hourlyRate).toBe(30); // retained
    expect(settings.transitPreference).toBe('ptv');
    expect(repo.store).toHaveLength(1);
  });

  it('round-trips a persisted row through get', async () => {
    await service.patch(DEVICE, { hourlyRate: 42, workplaceAddress: '1 Test St' });
    const settings = await service.get(DEVICE);
    expect(settings.hourlyRate).toBe(42);
    expect(settings.workplaceAddress).toBe('1 Test St');
  });

  describe('authenticated device-row claiming', () => {
    it('reads this device row while logged in, before ever claiming it', async () => {
      await service.patch(DEVICE, { hourlyRate: 30 });
      const settings = await service.get({ ...DEVICE, userId: 'user-1' });
      expect(settings.hourlyRate).toBe(30);
    });

    it('claims the unclaimed device row on first authenticated patch', async () => {
      await service.patch(DEVICE, { hourlyRate: 30 });
      await service.patch({ ...DEVICE, userId: 'user-1' }, { hourlyRate: 35 });
      expect(repo.store).toHaveLength(1); // updated in place, not duplicated
      expect(repo.store[0].userId).toBe('user-1');
      expect(repo.store[0].hourlyRate).toBe(35);
    });

    it('finds the claimed row by userId alone afterwards, even on a different device', async () => {
      await service.patch(DEVICE, { hourlyRate: 30 });
      await service.patch({ ...DEVICE, userId: 'user-1' }, {});
      const settings = await service.get({ deviceId: 'device-2', userId: 'user-1' });
      expect(settings.hourlyRate).toBe(30);
    });

    it('never leaks or hijacks another user’s already-claimed device row (shared computer)', async () => {
      await service.patch({ ...DEVICE, userId: 'user-1' }, { hourlyRate: 30 }); // claimed by user-1

      const settingsForUser2 = await service.get({ ...DEVICE, userId: 'user-2' });
      expect(settingsForUser2.hourlyRate).toBe(21); // defaults, not user-1's 30

      await service.patch({ ...DEVICE, userId: 'user-2' }, { hourlyRate: 50 });
      expect(repo.store).toHaveLength(2); // separate row created for user-2
      const user1Row = repo.store.find((s) => s.userId === 'user-1')!;
      expect(user1Row.hourlyRate).toBe(30); // untouched
    });
  });
});
