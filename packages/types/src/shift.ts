import { z } from 'zod';

export const ShiftSchema = z.object({
  id: z.string().uuid(),
  deviceId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM'),
  hoursWorked: z.number().nonnegative(),
  grossPay: z.number().nonnegative(),
  notes: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Shift = z.infer<typeof ShiftSchema>;

export const CreateShiftSchema = ShiftSchema.pick({
  date: true,
  startTime: true,
  endTime: true,
  notes: true,
}).extend({
  notes: z.string().optional(),
});

export type CreateShiftDto = z.infer<typeof CreateShiftSchema>;

export const UpdateShiftSchema = CreateShiftSchema.partial();
export type UpdateShiftDto = z.infer<typeof UpdateShiftSchema>;
