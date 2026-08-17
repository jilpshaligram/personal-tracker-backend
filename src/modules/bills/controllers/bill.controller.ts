import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseInterceptors,
  UploadedFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { BillHistoryService } from '../../bill-history/services/bill-history.service';
import { BillService } from '../services/bill.service';
import { CloudinaryService } from '../../../common/cloudinary/cloudinary.service';
import { CreateBillDto, createBillSchema } from '../dto/create-bill.dto';
import { UpdateBillDto, updateBillSchema } from '../dto/update-bill.dto';
import { PayBillDto, payBillSchema } from '../dto/pay-bill.dto';
import { BillFilterDto, billFilterSchema } from '../dto/bill-filter.dto';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { apiResponse } from '../../../common/responses/api-response.helper';
import type { IJwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import { BillStatus } from '../../bills/enums/bill-status.enum';
import { CloudinaryService } from '../../../common/cloudinary/cloudinary.service';
import { multerDocumentOptions } from '../../documents/multer.config';

interface AuthenticatedRequest extends Request {
  user: IJwtPayload;
}

function sanitizeBillBody(
  rawBody: Record<string, unknown>,
  isUpdate: boolean = false,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(rawBody || {})) {
    const cleanKey = key.trim();
    payload[cleanKey] = value;
  }

  if (payload.attachment !== undefined) {
    if (payload.attachment === '' || payload.attachment === 'undefined') {
      payload.attachment = isUpdate ? null : undefined;
    } else if (payload.attachment === null || payload.attachment === 'null') {
      payload.attachment = null;
    } else if (typeof payload.attachment === 'string') {
      try {
        payload.attachment = JSON.parse(payload.attachment);
      } catch {
        // keep string if not valid JSON
      }
    }
  }

  return payload;
}

@ApiTags('Bills')
@ApiBearerAuth()
@Controller('bills')
@UseGuards(AuthGuard)
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
      res.data,
      res.pagination as Record<string, unknown>,
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
  @UseInterceptors(FileInterceptor('attachment', multerDocumentOptions))
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiOperation({
    summary: 'Create new bill',
    description:
      'Schedules a new recurring or one-time bill. Accepts application/json or multipart/form-data with file attachment (receipt, invoice, or document). Supported file types: PDF, JPG, JPEG, PNG, WEBP, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV (max 10MB).',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['categoryId', 'title', 'amount', 'dueDate'],
      properties: {
        categoryId: {
          type: 'string',
          example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          description: 'Category UUID',
        },
        title: {
          type: 'string',
          example: 'Electricity Bill',
          description: 'Bill title',
        },
        description: {
          type: 'string',
          example: 'Monthly electric bill',
          description: 'Description',
        },
        amount: { type: 'number', example: 120.5, description: 'Bill amount' },
        dueDate: {
          type: 'string',
          example: '2026-09-01',
          description: 'Due Date (YYYY-MM-DD)',
        },
        isRecurring: {
          type: 'boolean',
          example: false,
          description: 'Is bill recurring',
        },
        recurringType: {
          type: 'string',
          enum: [
            'DAILY',
            'WEEKLY',
            'MONTHLY',
            'QUARTERLY',
            'HALF_YEARLY',
            'YEARLY',
          ],
          description: 'Recurring type',
        },
        reminderDaysBefore: {
          type: 'array',
          items: { type: 'number' },
          example: [1, 3, 7],
          description: 'Reminder days before due date',
        },
        attachment: {
          type: 'string',
          format: 'binary',
          description:
            'Bill receipt/invoice/document file (PDF, JPG, PNG, WEBP, DOC, XLS, etc. max 10MB)',
        },
        notes: {
          type: 'string',
          example: 'Account #12345',
          description: 'Notes',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Bill created successfully.' })
  async create(
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const rawBody = (req.body as Record<string, unknown>) || {};
    const payload = sanitizeBillBody(rawBody, false);

    if (file) {
      const uploadResult = await this.cloudinaryService.uploadFile(
        file,
        'bills',
      );
      payload.attachment = {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        fileName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      };
    }

    const parsed = createBillSchema.safeParse(payload);
    if (!parsed.success) {
      throw new BadRequestException({
        success: false,
        message: 'Validation failed',
        errors: parsed.error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    const data = await this.billService.create(req.user.sub, parsed.data);
    return apiResponse.success('Bill created successfully', data);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('attachment', multerDocumentOptions))
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiOperation({
    summary: 'Update bill',
    description:
      'Updates details of an existing bill. Accepts application/json or multipart/form-data with file attachment (receipt, invoice, or document). Supported file types: PDF, JPG, JPEG, PNG, WEBP, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV (max 10MB).',
  })
  @ApiParam({ name: 'id', description: 'Bill UUID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        categoryId: {
          type: 'string',
          example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          description: 'Category UUID',
        },
        title: {
          type: 'string',
          example: 'Updated Bill Title',
          description: 'Title',
        },
        description: {
          type: 'string',
          example: 'Updated description',
          description: 'Description',
        },
        amount: { type: 'number', example: 135.0, description: 'Amount' },
        dueDate: {
          type: 'string',
          example: '2026-09-15',
          description: 'Due Date (YYYY-MM-DD)',
        },
        isRecurring: {
          type: 'boolean',
          example: true,
          description: 'Is bill recurring',
        },
        recurringType: {
          type: 'string',
          enum: [
            'DAILY',
            'WEEKLY',
            'MONTHLY',
            'QUARTERLY',
            'HALF_YEARLY',
            'YEARLY',
          ],
          description: 'Recurring type',
        },
        reminderDaysBefore: {
          type: 'array',
          items: { type: 'number' },
          example: [3, 7],
          description: 'Reminder days before due date',
        },
        attachment: {
          type: 'string',
          format: 'binary',
          description:
            'New receipt/invoice/document file to upload (PDF, JPG, PNG, WEBP, DOC, XLS, etc. max 10MB)',
        },
        notes: {
          type: 'string',
          example: 'Updated notes',
          description: 'Notes',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Bill updated successfully.' })
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const rawBody = (req.body as Record<string, unknown>) || {};
    const payload = sanitizeBillBody(rawBody, true);

    if (file) {
      const existingBill = await this.billService.findOne(req.user.sub, id);
      if (existingBill.attachment?.publicId) {
        await this.cloudinaryService.deleteFile(
          existingBill.attachment.publicId,
          'auto',
        );
      }

      const uploadResult = await this.cloudinaryService.uploadFile(
        file,
        'bills',
      );
      payload.attachment = {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        fileName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      };
    }

    const parsed = updateBillSchema.safeParse(payload);
    if (!parsed.success) {
      throw new BadRequestException({
        success: false,
        message: 'Validation failed',
        errors: parsed.error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    const data = await this.billService.update(req.user.sub, id, parsed.data);
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
    description:
      'Marks bill as paid, deducts wallet balance, creates an expense transaction, and records payment history.',
  })
  @ApiParam({ name: 'id', description: 'Bill UUID' })
  @ApiResponse({ status: 200, description: 'Payment recorded successfully.' })
  async pay(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(payBillSchema)) dto: PayBillDto,
  ) {
    const data = (await this.billService.pay(req.user.sub, id, dto)) as Record<
      string,
      unknown
    >;
    return apiResponse.success('Payment recorded successfully', data);
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
    const res = await this.billHistoryService.findByBill(
      id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
    return apiResponse.success(
      'Bill history fetched successfully',
      res.data,
      res.pagination,
    );
  }
}
