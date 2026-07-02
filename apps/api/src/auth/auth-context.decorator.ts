import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { AuthUser } from '@shiftmate/types';
import { AuthContext } from './auth-context';

export const CurrentAuthContext = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): AuthContext => {
    const req = ctx.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    return {
      userId: req.user?.id,
      deviceId: (req.headers['x-device-id'] as string) ?? '',
    };
  },
);
