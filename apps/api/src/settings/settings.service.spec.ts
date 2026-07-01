import { SettingsService } from './settings.service';
import { SettingsEntity } from './settings.entity';

function makeRepo() {
  const store: SettingsEntity[] = [];
  return {
    store,
    findOne: jest.fn(async ({ where }: any) =>
      store.find((s) => s.deviceId === where.deviceId) ?? null,
    ),
    create: jest.fn((data: Partial<SettingsEntity>) => ({ ...data } as SettingsEntity)),
    save: jest.fn(async (e: SettingsEntity) => {
      const idx = store.findIndex((s) => s.deviceId === e.deviceId);
      if (idx >= 0) store[idx] = e;
      else store.push(e);
      return e;
    }),
  };
}

describe('SettingsService', () => {
  let repo: ReturnType<typeof makeRepo>;
  let service: SettingsService;
  const DEVICE = 'device-1';

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
});
