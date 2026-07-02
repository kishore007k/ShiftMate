import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '../../auth/auth.service';
import { SESSION_COOKIE } from '../../auth/constants';
import { parseCookies } from '../cookies';
import { AuthUser } from '@shiftmate/types';

/** Attaches `req.user` when a valid session cookie is present; never blocks the request.
 * Routes fall back to `x-device-id` when `req.user` is absent. */
@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
    req.user = token ? (await this.authService.verifySession(token)) ?? undefined : undefined;
    return true;
  }
}
