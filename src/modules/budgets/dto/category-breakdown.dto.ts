import { ApiProperty } from '@nestjs/swagger';

export class CategoryBreakdownItemDto {
  @ApiProperty({
    description: 'Total amount spent in this category for the budget period',
  })
  amount: number;

  @ApiProperty({ description: 'Category UUID' })
  categoryId: string;

  @ApiProperty({ description: 'Category Name' })
  categoryName: string;
}

export class CategoryBreakdownResponseDto {
  @ApiProperty({ description: 'Total budget amount' })
  budgetAmount: number;

  @ApiProperty({
    description:
      'Total amount spent across all categories within the budget period',
  })
  spentAmount: number;

  @ApiProperty({
    type: [CategoryBreakdownItemDto],
    description: 'List of category breakdowns',
  })
  categories: CategoryBreakdownItemDto[];
}
