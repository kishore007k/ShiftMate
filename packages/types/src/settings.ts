import { z } from 'zod';

export const UserSettingsSchema = z.object({
  hourlyRate: z.number().positive(),
  fortnightStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  taxBracket: z.enum(['auto', '0', '19', '32.5', '37', '45']),
  transitPreference: z.enum(['ptv', 'google']),
  workplaceAddress: z.string(),
  homeAddress: z.string(),
});

export type UserSettings = z.infer<typeof UserSettingsSchema>;
