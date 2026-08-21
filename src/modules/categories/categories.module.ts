import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CategoriesService } from '@/modules/categories/categories.service';
import { CategoriesController } from '@/modules/categories/categories.controller';
import { Category } from '@/modules/categories/category.schema';
@Module({
  imports: [SequelizeModule.forFeature([Category])],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService, SequelizeModule],
})
export class CategoriesModule {}
