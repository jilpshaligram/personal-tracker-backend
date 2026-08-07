import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UsePipes,
  Req,
} from '@nestjs/common';
import { BillHistoryService } from '../../bill-history/services/bill-history.service';
import { BillService } from '../services/bill.service';
import { CreateBillDto, createBillSchema } from '../dto/create-bill.dto';
import { UpdateBillDto, updateBillSchema } from '../dto/update-bill.dto';
import { PayBillDto, payBillSchema } from '../dto/pay-bill.dto';
import { BillFilterDto, billFilterSchema } from '../dto/bill-filter.dto';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { apiResponse } from '../../../common/responses/api-response.helper';

@Controller('bills')
@UseGuards(AuthGuard)
export class BillController {
  constructor(
    private readonly billService: BillService,
    private readonly billHistoryService: BillHistoryService,
  ) {}

  @Get()
  async findAll(
    @Req() req: any,
    @Query(new ZodValidationPipe(billFilterSchema)) filter: BillFilterDto,
  ) {
    const result = await this.billService.findAll(req.user.sub, filter);
    return apiResponse.success('Bills fetched successfully', result);
  }

  @Get('upcoming')
  async findUpcoming(@Req() req: any, @Query('days') days?: string) {
    const data = await this.billService.findUpcoming(
      req.user.sub,
      days ? parseInt(days) : 7,
    );
    return apiResponse.success('Upcoming bills fetched successfully', data);
  }

  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    const data = await this.billService.findOne(req.user.sub, id);
    return apiResponse.success('Bill fetched successfully', data);
  }

  @Post()
  @UsePipes(new ZodValidationPipe(createBillSchema))
  async create(@Req() req: any, @Body() dto: CreateBillDto) {
    const data = await this.billService.create(req.user.sub, dto);
    return apiResponse.success('Bill created successfully', data);
  }

  @Patch(':id')
  @UsePipes(new ZodValidationPipe(updateBillSchema))
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateBillDto,
  ) {
    const data = await this.billService.update(req.user.sub, id, dto);
    return apiResponse.success('Bill updated successfully', data);
  }

  @Delete(':id')
  async delete(@Req() req: any, @Param('id') id: string) {
    await this.billService.delete(req.user.sub, id);
    return apiResponse.success('Bill deleted successfully');
  }

  @Post(':id/pay')
  @UsePipes(new ZodValidationPipe(payBillSchema))
  async pay(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: PayBillDto,
  ) {
    await this.billService.pay(req.user.sub, id, dto);
    return apiResponse.success('Bill paid successfully');
  }

  @Get(':id/history')
  async getHistory(@Req() req: any, @Param('id') id: string) {
    // Validate bill exists and belongs to current user
    await this.billService.findOne(req.user.sub, id);
    const data = await this.billHistoryService.findByBill(id);
    return apiResponse.success('Bill history fetched successfully', data);
  }
}
