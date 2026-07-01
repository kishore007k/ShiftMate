import { z } from 'zod';

export const FortnightSummarySchema = z.object({
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  totalShifts: z.number().int().nonnegative(),
  totalHours: z.number().nonnegative(),
  grossPay: z.number().nonnegative(),
  estimatedTax: z.number().nonnegative(),
  netPay: z.number(),
  hourlyRate: z.number().positive(),
});

export type FortnightSummary = z.infer<typeof FortnightSummarySchema>;

export const DashboardDataSchema = z.object({
  fortnightlyEarnings: z.array(
    z.object({
      label: z.string(),
      gross: z.number(),
      net: z.number(),
    }),
  ),
  weeklyHours: z.array(
    z.object({
      label: z.string(),
      hours: z.number(),
    }),
  ),
  currentFortnight: FortnightSummarySchema,
});

export type DashboardData = z.infer<typeof DashboardDataSchema>;
