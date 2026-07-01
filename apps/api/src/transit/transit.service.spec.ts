import { mapDirectionsToDepartures, melbourneUnixMs } from './transit.service';

// Trimmed sample of a Google Directions transit response (two alternatives).
const sample = {
  status: 'OK',
  routes: [
    {
      legs: [
        {
          departure_time: { value: 1_700_000_000 },
          arrival_time: { value: 1_700_002_400 },
          steps: [
            { travel_mode: 'WALKING', duration: { value: 300 } },
            {
              travel_mode: 'TRANSIT',
              transit_details: {
                line: { short_name: '901', name: 'SmartBus' },
                headsign: 'Epping Station',
                departure_stop: { name: 'High St / Cooper St' },
              },
            },
            { travel_mode: 'WALKING', duration: { value: 120 } },
          ],
        },
      ],
    },
    {
      legs: [
        {
          departure_time: { value: 1_700_000_600 },
          arrival_time: { value: 1_700_003_000 },
          steps: [
            {
              travel_mode: 'TRANSIT',
              transit_details: {
                line: { name: 'Route 555' },
                departure_stop: { name: 'Station Rd' },
              },
            },
          ],
        },
      ],
    },
  ],
};

describe('mapDirectionsToDepartures', () => {
  it('maps each route to a BusDeparture, first is recommended', () => {
    const out = mapDirectionsToDepartures(sample);
    expect(out).toHaveLength(2);
    expect(out[0].isRecommended).toBe(true);
    expect(out[1].isRecommended).toBe(false);
  });

  it('extracts route number, name and stop from transit_details', () => {
    const [first] = mapDirectionsToDepartures(sample);
    expect(first.routeNumber).toBe('901');
    expect(first.routeName).toBe('Epping Station');
    expect(first.stopName).toBe('High St / Cooper St');
    expect(first.status).toBe('on-time');
  });

  it('sums walking steps into walkingMinutes (300s + 120s = 7min)', () => {
    const [first] = mapDirectionsToDepartures(sample);
    expect(first.walkingMinutes).toBe(7);
  });

  it('falls back to line.name when short_name is absent', () => {
    const [, second] = mapDirectionsToDepartures(sample);
    expect(second.routeNumber).toBe('Route 555');
    expect(second.walkingMinutes).toBe(0);
  });

  it('converts Google unix seconds to ISO datetime', () => {
    const [first] = mapDirectionsToDepartures(sample);
    expect(first.departureTime).toBe(new Date(1_700_000_000 * 1000).toISOString());
  });

  it('returns empty for no routes', () => {
    expect(mapDirectionsToDepartures({ status: 'OK', routes: [] })).toEqual([]);
  });

  it('skips walking-only alternatives (no transit leg)', () => {
    const withWalking = {
      status: 'OK',
      routes: [
        ...sample.routes,
        { legs: [{ steps: [{ travel_mode: 'WALKING', duration: { value: 1980 } }] }] },
      ],
    };
    const out = mapDirectionsToDepartures(withWalking);
    expect(out).toHaveLength(2); // walking-only route excluded
    expect(out.some((d) => d.stopName === 'Unknown stop')).toBe(false);
  });

  it('sorts departures by departure time ascending', () => {
    const out = mapDirectionsToDepartures(sample);
    expect(out[0].departureTime <= out[1].departureTime).toBe(true);
  });
});

describe('melbourneUnixMs', () => {
  it('interprets date + HH:MM as AEST (+10:00)', () => {
    expect(melbourneUnixMs('2026-07-01', '09:00')).toBe(Date.parse('2026-07-01T09:00:00+10:00'));
  });

  it('tolerates HH:MM:SS from Postgres', () => {
    expect(melbourneUnixMs('2026-07-01', '09:00:00')).toBe(melbourneUnixMs('2026-07-01', '09:00'));
  });
});
