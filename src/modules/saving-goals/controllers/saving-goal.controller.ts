import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { SavingGoalService } from '../services/saving-goal.service';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { successResponse } from '../../../common/responses/api-response.helper';
import {
  createSavingGoalSchema,
  CreateSavingGoalDto,
} from '../dto/create-saving-goal.dto';
import {
  updateSavingGoalSchema,
  UpdateSavingGoalDto,
} from '../dto/update-saving-goal.dto';
import type { IJwtPayload } from '../../auth/interfaces/jwt-payload.interface';

interface AuthenticatedRequest extends Request {
  user: IJwtPayload;
}

@Controller('saving-goals')
export class SavingGoalController {
  constructor(private readonly savingGoalService: SavingGoalService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(new ZodValidationPipe(createSavingGoalSchema))
    dto: CreateSavingGoalDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user.sub;
    const goal = await this.savingGoalService.create(userId, dto);
    return successResponse('Saving goal created successfully.', { goal });
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Req() req: AuthenticatedRequest) {
    const userId = req.user.sub;
    const goals = await this.savingGoalService.findAll(userId);
    return successResponse('Saving goals fetched successfully.', { goals });
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const userId = req.user.sub;
    const goal = await this.savingGoalService.findOne(id, userId);
    return successResponse('Saving goal fetched successfully.', { goal });
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateSavingGoalSchema))
    dto: UpdateSavingGoalDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user.sub;
    const goal = await this.savingGoalService.update(id, userId, dto);
    return successResponse('Saving goal updated successfully.', { goal });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const userId = req.user.sub;
    await this.savingGoalService.remove(id, userId);
    return successResponse('Saving goal deleted successfully.');
  }
}
