import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CategoriesService } from './services/categories.service';
import { CategoriesController } from './controllers/categories.controller';
import { Category } from './schemas/category.schema';
import { SecurityModule } from '../../infrastructure/security/security.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Category]),
    SecurityModule, // Provides SecurityService for AuthGuard
  ],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService, SequelizeModule], // In case TransactionsModule needs them
})
export class CategoriesModule {}
