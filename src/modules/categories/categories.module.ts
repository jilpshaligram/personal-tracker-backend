import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { CategoriesRepository } from './categories.repository';
import { Category } from './schemas/category.schema';
import { SecurityModule } from '../../infrastructure/security/security.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Category]),
    SecurityModule, // Provides SecurityService for AuthGuard
  ],
  controllers: [CategoriesController],
  providers: [CategoriesService, CategoriesRepository],
  exports: [CategoriesService, CategoriesRepository], // In case TransactionsModule needs them
})
export class CategoriesModule {}
