import { Controller, Get, Post, Patch, Delete, Param, Body, Headers, HttpCode } from '@nestjs/common';
import { ShiftsService } from './shifts.service';
import { Shift, CreateShiftDto, UpdateShiftDto } from '@shiftmate/types';

@Controller('shifts')
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Get()
  findAll(@Headers('x-device-id') deviceId: string): Promise<Shift[]> {
    return this.shiftsService.findAll(deviceId ?? '');
  }

  @Get(':id')
  findOne(
    @Headers('x-device-id') deviceId: string,
    @Param('id') id: string,
  ): Promise<Shift> {
    return this.shiftsService.findOne(deviceId ?? '', id);
  }

  @Post()
  create(
    @Headers('x-device-id') deviceId: string,
    @Body() body: CreateShiftDto,
  ): Promise<Shift> {
    return this.shiftsService.create(deviceId ?? '', body);
  }

  @Patch(':id')
  update(
    @Headers('x-device-id') deviceId: string,
    @Param('id') id: string,
    @Body() body: UpdateShiftDto,
  ): Promise<Shift> {
    return this.shiftsService.update(deviceId ?? '', id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(
    @Headers('x-device-id') deviceId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.shiftsService.remove(deviceId ?? '', id);
  }
}
