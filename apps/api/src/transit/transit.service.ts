import {
  Injectable,
  ServiceUnavailableException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BusDeparture } from '@shiftmate/types';
import { SettingsService } from '../settings/settings.service';
import { ShiftsService } from '../shifts/shifts.service';

const DIRECTIONS_URL = 'https://maps.googleapis.com/maps/api/directions/json';

@Injectable()
export class TransitService {
  constructor(
    private readonly config: ConfigService,
    private readonly settingsService: SettingsService,
    private readonly shiftsService: ShiftsService,
  ) {}

  async getDepartures(deviceId: string): Promise<BusDeparture[]> {
    const apiKey = this.config.get<string>('GOOGLE_MAPS_API_KEY');
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'Transit is not configured (missing GOOGLE_MAPS_API_KEY).',
      );
    }

    const settings = await this.settingsService.get(deviceId);
    if (!settings.homeAddress) {
      throw new BadRequestException('Set your home address in settings to see transit options.');
    }

    const params = new URLSearchParams({
      origin: settings.homeAddress,
      destination: settings.workplaceAddress,
      mode: 'transit',
      transit_mode: 'bus',
      alternatives: 'true',
      key: apiKey,
    });
    const arrival = await this.nextShiftArrivalUnix(deviceId);
    if (arrival) params.set('arrival_time', String(arrival));

    const res = await fetch(`${DIRECTIONS_URL}?${params.toString()}`);
    const json = (await res.json()) as DirectionsResponse;

    if (json.status !== 'OK') {
      if (json.status === 'ZERO_RESULTS') return [];
      throw new ServiceUnavailableException(`Transit lookup failed: ${json.status}`);
    }
    return mapDirectionsToDepartures(json);
  }

  /** Unix seconds of the next upcoming shift's start, or null if none. */
  private async nextShiftArrivalUnix(deviceId: string): Promise<number | null> {
    const shifts = await this.shiftsService.findAll(deviceId);
    const now = Date.now();
    const upcoming = shifts
      .map((s) => melbourneUnixMs(s.date, s.startTime))
      .filter((t) => t > now)
      .sort((a, b) => a - b);
    return upcoming[0] ? Math.floor(upcoming[0] / 1000) : null;
  }
}

/** ponytail: fixed +10:00 (AEST). DST (+11 in summer) is the calibration knob if arrivals drift. */
export function melbourneUnixMs(date: string, time: string): number {
  return new Date(`${date}T${time.slice(0, 5)}:00+10:00`).getTime();
}

/**
 * Map a Google Directions transit response into our BusDeparture[].
 * Skips walking-only alternatives (no transit leg); Google's top route is flagged recommended;
 * result is sorted by departure time (soonest first).
 */
export function mapDirectionsToDepartures(json: DirectionsResponse): BusDeparture[] {
  const out: BusDeparture[] = [];
  for (const route of json.routes ?? []) {
    const leg = route.legs[0];
    const td = leg.steps.find((s) => s.travel_mode === 'TRANSIT')?.transit_details;
    if (!td) continue; // skip walking-only alternatives — not a bus departure

    const walkingSecs = leg.steps
      .filter((s) => s.travel_mode === 'WALKING')
      .reduce((sum, s) => sum + (s.duration?.value ?? 0), 0);

    out.push({
      routeNumber: td.line?.short_name ?? td.line?.name ?? '—',
      routeName: td.headsign ?? td.line?.name ?? 'Transit',
      departureTime: new Date((leg.departure_time?.value ?? 0) * 1000).toISOString(),
      arrivalTime: new Date((leg.arrival_time?.value ?? 0) * 1000).toISOString(),
      walkingMinutes: Math.round(walkingSecs / 60),
      stopName: td.departure_stop?.name ?? 'Unknown stop',
      isRecommended: out.length === 0, // Google's first transit route
      status: 'on-time',
    });
  }
  return out.sort((a, b) => a.departureTime.localeCompare(b.departureTime));
}

// Minimal shape of the Google Directions fields we consume.
interface DirectionsResponse {
  status: string;
  routes?: {
    legs: {
      departure_time?: { value: number };
      arrival_time?: { value: number };
      steps: {
        travel_mode: string;
        duration?: { value: number };
        transit_details?: {
          line?: { short_name?: string; name?: string };
          headsign?: string;
          departure_stop?: { name?: string };
        };
      }[];
    }[];
  }[];
}
