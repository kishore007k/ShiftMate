import { Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../users/user.entity';
import { AuthUser } from '@shiftmate/types';

export type Provider = 'google' | 'github';

interface OAuthProfile {
  providerUserId: string;
  email: string;
  name: string;
}

interface SessionPayload {
  sub: string;
  email: string;
  name: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  /** Where the provider should redirect back to after the user approves.
   * This is the web app's own origin, not the API's — the web app proxies /api/*
   * to this service (see apps/web/next.config.mjs), so the session cookie ends up
   * first-party to the browser instead of cross-site (Safari/iOS blocks the latter). */
  redirectUri(provider: Provider): string {
    const webOrigin = this.config.get<string>('WEB_ORIGIN', 'http://localhost:3001');
    return `${webOrigin.replace(/\/+$/, '')}/api/auth/${provider}/callback`;
  }

  authorizeUrl(provider: Provider, state: string): string {
    const redirectUri = this.redirectUri(provider);
    if (provider === 'google') {
      const clientId = this.requireEnv('GOOGLE_CLIENT_ID');
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        state,
      });
      return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    }
    const clientId = this.requireEnv('GITHUB_CLIENT_ID');
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'read:user user:email',
      state,
    });
    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  async exchangeCode(provider: Provider, code: string): Promise<UserEntity> {
    const profile =
      provider === 'google' ? await this.fetchGoogleProfile(code) : await this.fetchGithubProfile(code);
    return this.findOrCreateUser(provider, profile);
  }

  signSession(user: UserEntity): string {
    const payload: SessionPayload = { sub: user.id, email: user.email, name: user.name };
    return this.jwt.sign(payload);
  }

  async verifySession(token: string): Promise<AuthUser | null> {
    try {
      const payload = await this.jwt.verifyAsync<SessionPayload>(token);
      return { id: payload.sub, email: payload.email, name: payload.name };
    } catch {
      return null;
    }
  }

  private async fetchGoogleProfile(code: string): Promise<OAuthProfile> {
    const clientId = this.requireEnv('GOOGLE_CLIENT_ID');
    const clientSecret = this.requireEnv('GOOGLE_CLIENT_SECRET');

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: this.redirectUri('google'),
        grant_type: 'authorization_code',
      }),
    });
    if (!tokenRes.ok) {
      throw new UnauthorizedException('Google rejected the authorization code.');
    }
    const { access_token } = (await tokenRes.json()) as { access_token: string };

    const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (!profileRes.ok) {
      throw new UnauthorizedException('Could not fetch Google profile.');
    }
    const profile = (await profileRes.json()) as { sub: string; email: string; name: string };
    return { providerUserId: profile.sub, email: profile.email, name: profile.name };
  }

  private async fetchGithubProfile(code: string): Promise<OAuthProfile> {
    const clientId = this.requireEnv('GITHUB_CLIENT_ID');
    const clientSecret = this.requireEnv('GITHUB_CLIENT_SECRET');

    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: this.redirectUri('github'),
      }),
    });
    if (!tokenRes.ok) {
      throw new UnauthorizedException('GitHub rejected the authorization code.');
    }
    const tokenJson = (await tokenRes.json()) as { access_token?: string; error?: string };
    if (!tokenJson.access_token) {
      throw new UnauthorizedException(tokenJson.error ?? 'GitHub rejected the authorization code.');
    }

    const headers = {
      Authorization: `Bearer ${tokenJson.access_token}`,
      Accept: 'application/vnd.github+json',
    };
    const profileRes = await fetch('https://api.github.com/user', { headers });
    if (!profileRes.ok) {
      throw new UnauthorizedException('Could not fetch GitHub profile.');
    }
    const profile = (await profileRes.json()) as { id: number; login: string; name: string | null };

    // GitHub only includes `email` on /user if the user made it public; fall back to
    // the emails endpoint and pick the verified primary address.
    let email = (profile as { email?: string | null }).email ?? null;
    if (!email) {
      const emailsRes = await fetch('https://api.github.com/user/emails', { headers });
      if (emailsRes.ok) {
        const emails = (await emailsRes.json()) as { email: string; primary: boolean; verified: boolean }[];
        email = emails.find((e) => e.primary && e.verified)?.email ?? emails[0]?.email ?? null;
      }
    }
    if (!email) {
      throw new UnauthorizedException('Your GitHub account has no accessible email address.');
    }

    return {
      providerUserId: String(profile.id),
      email,
      name: profile.name ?? profile.login,
    };
  }

  private async findOrCreateUser(provider: Provider, profile: OAuthProfile): Promise<UserEntity> {
    const existing = await this.userRepo.findOne({
      where: { provider, providerUserId: profile.providerUserId },
    });
    if (existing) {
      existing.email = profile.email;
      existing.name = profile.name;
      return this.userRepo.save(existing);
    }
    const created = this.userRepo.create({
      provider,
      providerUserId: profile.providerUserId,
      email: profile.email,
      name: profile.name,
    });
    return this.userRepo.save(created);
  }

  private requireEnv(key: string): string {
    const value = this.config.get<string>(key);
    if (!value) {
      throw new ServiceUnavailableException(`Sign-in is not configured (missing ${key}).`);
    }
    return value;
  }
}
