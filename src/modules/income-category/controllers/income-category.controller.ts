import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IncomeCategoryService } from '../services/income-category.service';

@ApiTags('Income Categories')
@Controller('income-category')
export class IncomeCategoryController {
  constructor(private readonly incomeCategoryService: IncomeCategoryService) {}
}
