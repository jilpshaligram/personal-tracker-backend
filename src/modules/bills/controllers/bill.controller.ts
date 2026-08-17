import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { BillHistoryService } from '../../bill-history/services/bill-history.service';
import { BillService } from '../services/bill.service';
import { CreateBillDto, createBillSchema } from '../dto/create-bill.dto';
import { UpdateBillDto, updateBillSchema } from '../dto/update-bill.dto';
import { PayBillDto, payBillSchema } from '../dto/pay-bill.dto';
import { BillFilterDto, billFilterSchema } from '../dto/bill-filter.dto';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { apiResponse } from '../../../common/responses/api-response.helper';
import type { IJwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import { BillStatus } from '../../bills/enums/bill-status.enum';
import { CloudinaryService } from '../../../common/cloudinary/cloudinary.service';

interface AuthenticatedRequest extends Request {
  user: IJwtPayload;
}

@ApiTags('Bills')
@ApiBearerAuth()
@Controller('bills')
export class BillController {
  constructor(
    private readonly billService: BillService,
    private readonly billHistoryService: BillHistoryService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get all bills',
    description: 'Retrieves user bills with filtering, search, and pagination.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    example: 'Electricity',
  })
  @ApiQuery({ name: 'status', required: false, enum: BillStatus })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiQuery({ name: 'isRecurring', required: false, type: Boolean })
  @ApiQuery({
    name: 'dueFrom',
    required: false,
    type: String,
    example: '2026-01-01',
  })
  @ApiQuery({
    name: 'dueTo',
    required: false,
    type: String,
    example: '2026-12-31',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['dueDate', 'amount', 'title', 'status', 'createdAt'],
  })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @ApiResponse({ status: 200, description: 'Bills fetched successfully.' })
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query(new ZodValidationPipe(billFilterSchema)) filter: BillFilterDto,
  ) {
    const { data, pagination } = await this.billService.findAll(
      req.user.sub,
      filter,
    );
    return apiResponse.success('Bills fetched successfully', data, pagination);
  }

  @Get('upcoming')
  @ApiOperation({
    summary: 'Get upcoming bills',
    description: 'Retrieves upcoming bills within specified days.',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    example: '7',
    description: 'Number of upcoming days to query (default 7)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    example: '1',
    description: 'Page number (default 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: '10',
    description: 'Page limit (default 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'Upcoming bills fetched successfully.',
  })
  async findUpcoming(
    @Req() req: AuthenticatedRequest,
    @Query('days') days?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const { data, pagination } = await this.billService.findUpcoming(
      req.user.sub,
      days ? parseInt(days, 10) : 7,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
    return apiResponse.success(
      'Upcoming bills fetched successfully',
      data,
      pagination,
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get bill by ID',
    description: 'Retrieves bill details.',
  })
  @ApiParam({ name: 'id', description: 'Bill UUID' })
  @ApiResponse({ status: 200, description: 'Bill fetched successfully.' })
  @ApiResponse({ status: 404, description: 'Bill not found.' })
  async findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const data = await this.billService.findOne(req.user.sub, id);
    return apiResponse.success('Bill fetched successfully', data);
  }

  @Post()
  @ApiOperation({
    summary: 'Create new bill',
    description: 'Schedules a new recurring or one-time bill.',
  })
  @ApiResponse({ status: 201, description: 'Bill created successfully.' })
  @UseInterceptors(FileInterceptor('attachment'))
  async create(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createBillSchema)) dto: CreateBillDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) {
      const uploadResult = await this.cloudinaryService.uploadFile(file);
      dto.attachment = {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        fileName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      };
    }

    const data = await this.billService.create(req.user.sub, dto);
    return apiResponse.success('Bill created successfully', data);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update bill',
    description: 'Updates details of an existing bill.',
  })
  @ApiParam({ name: 'id', description: 'Bill UUID' })
  @ApiResponse({ status: 200, description: 'Bill updated successfully.' })
  @UseInterceptors(FileInterceptor('attachment'))
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateBillSchema)) dto: UpdateBillDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) {
      const uploadResult = await this.cloudinaryService.uploadFile(file);
      dto.attachment = {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        fileName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      };
    }

    const data = await this.billService.update(req.user.sub, id, dto);
    return apiResponse.success('Bill updated successfully', data);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete bill',
    description: 'Deletes a bill record.',
  })
  @ApiParam({ name: 'id', description: 'Bill UUID' })
  @ApiResponse({ status: 200, description: 'Bill deleted successfully.' })
  async delete(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    await this.billService.delete(req.user.sub, id);
    return apiResponse.success('Bill deleted successfully');
  }

  @Post(':id/pay')
  @ApiOperation({
    summary: 'Pay bill',
    description: 'Marks bill as paid and optionally creates a transaction.',
  })
  @ApiParam({ name: 'id', description: 'Bill UUID' })
  @ApiResponse({ status: 200, description: 'Bill paid successfully.' })
  async pay(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(payBillSchema)) dto: PayBillDto,
  ) {
    const result = await this.billService.pay(req.user.sub, id, dto);
    const message =
      result.status === BillStatus.PARTIALLY_PAID
        ? `Partial payment recorded successfully. Remaining amount: ${result.remainingAmount}`
        : 'Bill paid successfully';
    return apiResponse.success(message, result);
  }

  @Get(':id/history')
  @ApiOperation({
    summary: 'Get bill history',
    description: 'Retrieves payment history for a bill.',
  })
  @ApiParam({ name: 'id', description: 'Bill UUID' })
  @ApiQuery({
    name: 'page',
    required: false,
    example: '1',
    description: 'Page number (default 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: '10',
    description: 'Page limit (default 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'Bill history fetched successfully.',
  })
  async getHistory(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    await this.billService.findOne(req.user.sub, id);
    const { data, pagination } = await this.billHistoryService.findByBill(
      id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
    return apiResponse.success(
      'Bill history fetched successfully',
      data,
      pagination,
    );
  }
}
