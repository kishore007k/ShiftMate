import { Controller, Get, Post, Patch, Delete, Param, Body, Headers, HttpCode } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiBody,
} from '@nestjs/swagger';
import { ShiftsService } from './shifts.service';
import { Shift, CreateShiftDto, UpdateShiftDto } from '@shiftmate/types';
import { shiftSchema, createShiftSchema, updateShiftSchema } from '../swagger';

@ApiTags('shifts')
@Controller('shifts')
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Get()
  @ApiOperation({ summary: 'List all shifts (newest first)' })
  @ApiOkResponse({ schema: { type: 'array', items: shiftSchema } })
  findAll(@Headers('x-device-id') deviceId: string): Promise<Shift[]> {
    return this.shiftsService.findAll(deviceId ?? '');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a shift by id' })
  @ApiOkResponse({ schema: shiftSchema })
  @ApiNotFoundResponse({ description: 'Shift not found for this device' })
  findOne(@Headers('x-device-id') deviceId: string, @Param('id') id: string): Promise<Shift> {
    return this.shiftsService.findOne(deviceId ?? '', id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a shift (hours & gross pay are computed server-side)' })
  @ApiBody({ schema: createShiftSchema })
  @ApiCreatedResponse({ schema: shiftSchema })
  create(@Headers('x-device-id') deviceId: string, @Body() body: CreateShiftDto): Promise<Shift> {
    return this.shiftsService.create(deviceId ?? '', body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a shift (pay recomputed if times change)' })
  @ApiBody({ schema: updateShiftSchema })
  @ApiOkResponse({ schema: shiftSchema })
  @ApiNotFoundResponse({ description: 'Shift not found for this device' })
  update(
    @Headers('x-device-id') deviceId: string,
    @Param('id') id: string,
    @Body() body: UpdateShiftDto,
  ): Promise<Shift> {
    return this.shiftsService.update(deviceId ?? '', id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a shift' })
  @ApiNoContentResponse({ description: 'Shift deleted' })
  @ApiNotFoundResponse({ description: 'Shift not found for this device' })
  remove(@Headers('x-device-id') deviceId: string, @Param('id') id: string): Promise<void> {
    return this.shiftsService.remove(deviceId ?? '', id);
  }
}
