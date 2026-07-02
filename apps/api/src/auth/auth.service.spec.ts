import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UserEntity } from '../users/user.entity';

function makeRepo() {
  const store: UserEntity[] = [];
  let nextId = 1;
  return {
    store,
    findOne: jest.fn(
      async ({ where }: { where: { provider: string; providerUserId: string } }) =>
        store.find(
          (u) => u.provider === where.provider && u.providerUserId === where.providerUserId,
        ) ?? null,
    ),
    create: jest.fn((data: Partial<UserEntity>) => ({ ...data }) as UserEntity),
    save: jest.fn(async (u: UserEntity) => {
      if (!u.id) u.id = `id-${nextId++}`;
      const idx = store.findIndex((s) => s.id === u.id);
      if (idx >= 0) store[idx] = u;
      else store.push(u);
      return u;
    }),
  };
}

describe('AuthService', () => {
  let repo: ReturnType<typeof makeRepo>;
  let service: AuthService;

  beforeEach(() => {
    repo = makeRepo();
    const config = new ConfigService({ JWT_SECRET: 'test-secret' });
    const jwt = new JwtService({ secret: 'test-secret', signOptions: { expiresIn: '30d' } });
    service = new AuthService(config, jwt, repo as any);
  });

  describe('session tokens', () => {
    it('round-trips a signed session back to the same user info', async () => {
      const user = { id: 'u1', email: 'a@b.com', name: 'A B' } as UserEntity;
      const token = service.signSession(user);
      expect(await service.verifySession(token)).toEqual({
        id: 'u1',
        email: 'a@b.com',
        name: 'A B',
      });
    });

    it('rejects a garbage token', async () => {
      expect(await service.verifySession('not-a-jwt')).toBeNull();
    });

    it('rejects a token signed with a different secret', async () => {
      const otherJwt = new JwtService({ secret: 'wrong-secret' });
      const token = otherJwt.sign({ sub: 'u1', email: 'a@b.com', name: 'A' });
      expect(await service.verifySession(token)).toBeNull();
    });
  });

  describe('findOrCreateUser', () => {
    it('creates a new user on first sign-in', async () => {
      const user = await (service as any).findOrCreateUser('google', {
        providerUserId: 'g1',
        email: 'a@b.com',
        name: 'A',
      });
      expect(user.provider).toBe('google');
      expect(repo.store).toHaveLength(1);
    });

    it('reuses the existing user on repeat sign-in and refreshes profile fields', async () => {
      await (service as any).findOrCreateUser('google', {
        providerUserId: 'g1',
        email: 'old@b.com',
        name: 'Old',
      });
      const user = await (service as any).findOrCreateUser('google', {
        providerUserId: 'g1',
        email: 'new@b.com',
        name: 'New',
      });
      expect(repo.store).toHaveLength(1); // updated in place, not duplicated
      expect(user.email).toBe('new@b.com');
      expect(user.name).toBe('New');
    });

    it('treats the same providerUserId under a different provider as a different user', async () => {
      await (service as any).findOrCreateUser('google', {
        providerUserId: '1',
        email: 'a@b.com',
        name: 'A',
      });
      await (service as any).findOrCreateUser('github', {
        providerUserId: '1',
        email: 'a@b.com',
        name: 'A',
      });
      expect(repo.store).toHaveLength(2);
    });
  });
});
