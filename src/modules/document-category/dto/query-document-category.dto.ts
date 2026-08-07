import { Transform } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';
import { QueryDto } from '../../../common/dto/query.dto';

export class QueryDocumentCategoryDto extends QueryDto {
  @IsOptional()
  @Transform(({ value }): string | undefined => {
    if (typeof value === 'string') {
      return value.toLowerCase();
    }

    return undefined;
  })
  @IsEnum(['active', 'inactive'])
  status?: 'active' | 'inactive';
}
