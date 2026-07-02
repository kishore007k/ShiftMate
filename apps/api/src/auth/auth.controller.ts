import { Controller, Get, Post, Query, Req, Res, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { AuthService, Provider } from './auth.service';
import { parseCookies } from '../common/cookies';
import { SESSION_COOKIE, STATE_COOKIE } from './constants';
import { AuthUser } from '@shiftmate/types';
import { ShiftsService } from '../shifts/shifts.service';
import { CurrentAuthContext } from './auth-context.decorator';
import { AuthContext } from './auth-context';

const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const STATE_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
    private readonly shiftsService: ShiftsService,
  ) {}

  @Get('google')
  @ApiOperation({ summary: 'Redirect to Google to sign in' })
  google(@Res() res: Response): void {
    this.startOAuth('google', res);
  }

  @Get('google/callback')
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    await this.finishOAuth('google', code, state, req, res);
  }

  @Get('github')
  @ApiOperation({ summary: 'Redirect to GitHub to sign in' })
  github(@Res() res: Response): void {
    this.startOAuth('github', res);
  }

  @Get('github/callback')
  @ApiOperation({ summary: 'GitHub OAuth callback' })
  async githubCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    await this.finishOAuth('github', code, state, req, res);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get the signed-in user (401 if not signed in)' })
  @ApiOkResponse({ schema: { type: 'object', properties: { id: {}, email: {}, name: {} } } })
  async me(@Req() req: Request): Promise<AuthUser> {
    const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
    const user = token ? await this.authService.verifySession(token) : null;
    if (!user) throw new UnauthorizedException('Not signed in.');
    return user;
  }

  @Post('logout')
  @ApiOperation({ summary: 'Clear the session cookie' })
  logout(@Res() res: Response): void {
    res.clearCookie(SESSION_COOKIE, this.cookieOptions(0));
    res.status(204).send();
  }

  @Post('merge')
  @ApiOperation({
    summary:
      "Link this device's still-unclaimed shift history to the signed-in user (explicit, user-initiated)",
  })
  @ApiOkResponse({ schema: { type: 'object', properties: { claimed: { type: 'integer' } } } })
  async merge(@CurrentAuthContext() authCtx: AuthContext): Promise<{ claimed: number }> {
    if (!authCtx.userId) throw new UnauthorizedException('Sign in first.');
    const claimed = await this.shiftsService.claimForCurrentUser(authCtx);
    return { claimed };
  }

  private startOAuth(provider: Provider, res: Response): void {
    const state = randomBytes(16).toString('hex');
    res.cookie(STATE_COOKIE, state, this.cookieOptions(STATE_MAX_AGE_MS));
    res.redirect(this.authService.authorizeUrl(provider, state));
  }

  private async finishOAuth(
    provider: Provider,
    code: string,
    state: string,
    req: Request,
    res: Response,
  ): Promise<void> {
    const expectedState = parseCookies(req.headers.cookie)[STATE_COOKIE];
    res.clearCookie(STATE_COOKIE, this.cookieOptions(0));
    if (!state || !expectedState || state !== expectedState) {
      throw new UnauthorizedException('OAuth state mismatch — please try signing in again.');
    }

    const user = await this.authService.exchangeCode(provider, code);
    const session = this.authService.signSession(user);
    res.cookie(SESSION_COOKIE, session, this.cookieOptions(SESSION_MAX_AGE_MS));

    const webOrigin = this.config.get<string>('WEB_ORIGIN', 'http://localhost:3001');
    res.redirect(webOrigin.replace(/\/+$/, ''));
  }

  private cookieOptions(maxAgeMs: number) {
    const isProd = this.config.get<string>('NODE_ENV') === 'production';
    return {
      httpOnly: true,
      secure: isProd,
      sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
      maxAge: maxAgeMs,
      path: '/',
    };
  }
}
