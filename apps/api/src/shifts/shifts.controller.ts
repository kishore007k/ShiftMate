import { Controller, Get, Post, Patch, Delete, Param, Body, HttpCode } from '@nestjs/common';
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
import { CurrentAuthContext } from '../auth/auth-context.decorator';
import { AuthContext } from '../auth/auth-context';

@ApiTags('shifts')
@Controller('shifts')
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Get()
  @ApiOperation({ summary: 'List all shifts (newest first)' })
  @ApiOkResponse({ schema: { type: 'array', items: shiftSchema } })
  findAll(@CurrentAuthContext() authCtx: AuthContext): Promise<Shift[]> {
    return this.shiftsService.findAll(authCtx);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a shift by id' })
  @ApiOkResponse({ schema: shiftSchema })
  @ApiNotFoundResponse({ description: 'Shift not found for this device' })
  findOne(@CurrentAuthContext() authCtx: AuthContext, @Param('id') id: string): Promise<Shift> {
    return this.shiftsService.findOne(authCtx, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a shift (hours & gross pay are computed server-side)' })
  @ApiBody({ schema: createShiftSchema })
  @ApiCreatedResponse({ schema: shiftSchema })
  create(
    @CurrentAuthContext() authCtx: AuthContext,
    @Body() body: CreateShiftDto,
  ): Promise<Shift> {
    return this.shiftsService.create(authCtx, body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a shift (pay recomputed if times change)' })
  @ApiBody({ schema: updateShiftSchema })
  @ApiOkResponse({ schema: shiftSchema })
  @ApiNotFoundResponse({ description: 'Shift not found for this device' })
  update(
    @CurrentAuthContext() authCtx: AuthContext,
    @Param('id') id: string,
    @Body() body: UpdateShiftDto,
  ): Promise<Shift> {
    return this.shiftsService.update(authCtx, id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a shift' })
  @ApiNoContentResponse({ description: 'Shift deleted' })
  @ApiNotFoundResponse({ description: 'Shift not found for this device' })
  remove(@CurrentAuthContext() authCtx: AuthContext, @Param('id') id: string): Promise<void> {
    return this.shiftsService.remove(authCtx, id);
  }
}
