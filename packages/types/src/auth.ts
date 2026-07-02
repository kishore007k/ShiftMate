import { z } from 'zod';

export const AuthUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string(),
  name: z.string(),
});

export type AuthUser = z.infer<typeof AuthUserSchema>;
