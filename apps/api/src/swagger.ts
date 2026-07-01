import type { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

// Reusable OpenAPI schemas — our request/response DTOs are zod-inferred types (not classes),
// so Swagger can't auto-generate models. These describe the shapes for the docs.

export const shiftSchema: SchemaObject = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    deviceId: { type: 'string', example: 'a1b2c3d4' },
    date: { type: 'string', example: '2026-07-03', description: 'YYYY-MM-DD' },
    startTime: { type: 'string', example: '09:00:00' },
    endTime: { type: 'string', example: '17:00:00' },
    hoursWorked: { type: 'number', example: 8 },
    grossPay: { type: 'number', example: 168 },
    notes: { type: 'string', nullable: true, example: 'Kitchen' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

export const createShiftSchema: SchemaObject = {
  type: 'object',
  required: ['date', 'startTime', 'endTime'],
  properties: {
    date: { type: 'string', example: '2026-07-03', description: 'YYYY-MM-DD' },
    startTime: { type: 'string', example: '09:00', description: 'HH:MM (24h)' },
    endTime: { type: 'string', example: '17:00', description: 'HH:MM (24h); may cross midnight' },
    notes: { type: 'string', example: 'Kitchen' },
  },
};

export const updateShiftSchema: SchemaObject = {
  type: 'object',
  properties: createShiftSchema.properties,
};

export const userSettingsSchema: SchemaObject = {
  type: 'object',
  properties: {
    hourlyRate: { type: 'number', example: 21 },
    fortnightStart: { type: 'string', example: '2025-01-06', description: 'YYYY-MM-DD' },
    taxBracket: { type: 'string', enum: ['auto', '0', '19', '32.5', '37', '45'], example: 'auto' },
    transitPreference: { type: 'string', enum: ['google', 'ptv'], example: 'google' },
    workplaceAddress: { type: 'string', example: '793 High Street, Epping VIC 3076' },
    homeAddress: { type: 'string', example: 'Lyndarum Drive, Epping VIC 3076' },
  },
};

export const fortnightSummarySchema: SchemaObject = {
  type: 'object',
  properties: {
    start: { type: 'string', example: '2026-06-22' },
    end: { type: 'string', example: '2026-07-05' },
    totalShifts: { type: 'integer', example: 3 },
    totalHours: { type: 'number', example: 18 },
    grossPay: { type: 'number', example: 378 },
    estimatedTax: { type: 'number', example: 0 },
    netPay: { type: 'number', example: 378 },
    hourlyRate: { type: 'number', example: 21 },
  },
};

export const dashboardSchema: SchemaObject = {
  type: 'object',
  properties: {
    fortnightlyEarnings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string', example: '22 Jun' },
          gross: { type: 'number' },
          net: { type: 'number' },
        },
      },
    },
    weeklyHours: {
      type: 'array',
      items: {
        type: 'object',
        properties: { label: { type: 'string', example: '29 Jun' }, hours: { type: 'number' } },
      },
    },
    currentFortnight: fortnightSummarySchema,
  },
};

export const busDepartureSchema: SchemaObject = {
  type: 'object',
  properties: {
    routeNumber: { type: 'string', example: '357' },
    routeName: { type: 'string', example: 'Thomastown Station' },
    departureTime: { type: 'string', format: 'date-time' },
    arrivalTime: { type: 'string', format: 'date-time' },
    walkingMinutes: { type: 'integer', example: 3 },
    stopName: { type: 'string', example: 'Great Brome Ave/Lyndarum Dr' },
    isRecommended: { type: 'boolean', example: true },
    status: { type: 'string', enum: ['on-time', 'delayed', 'cancelled'], example: 'on-time' },
    delayMinutes: { type: 'integer', nullable: true },
  },
};

export const importBodySchema: SchemaObject = {
  type: 'object',
  required: ['csv'],
  properties: {
    csv: {
      type: 'string',
      example: 'Date,Start,End,Notes\r\n2026-07-03,09:00,17:00,Kitchen',
      description: 'CSV text with a Date, Start, End (and optional Notes) header.',
    },
  },
};

export const importResultSchema: SchemaObject = {
  type: 'object',
  properties: {
    imported: { type: 'integer', example: 129 },
    conflicts: { type: 'integer', example: 0, description: 'Rows skipped as duplicates' },
    errors: {
      type: 'array',
      items: {
        type: 'object',
        properties: { row: { type: 'integer' }, reason: { type: 'string' } },
      },
    },
  },
};

export const healthSchema: SchemaObject = {
  type: 'object',
  properties: {
    status: { type: 'string', example: 'ok' },
    timestamp: { type: 'string', format: 'date-time' },
    db: { type: 'string', enum: ['connected', 'disconnected'], example: 'connected' },
  },
};
