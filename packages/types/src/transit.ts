import { z } from 'zod';

export const BusDepartureSchema = z.object({
  routeNumber: z.string(),
  routeName: z.string(),
  departureTime: z.string().datetime(),
  arrivalTime: z.string().datetime(),
  walkingMinutes: z.number().int().nonnegative(),
  stopName: z.string(),
  isRecommended: z.boolean(),
  status: z.enum(['on-time', 'delayed', 'cancelled']),
  delayMinutes: z.number().int().optional(),
});

export type BusDeparture = z.infer<typeof BusDepartureSchema>;
