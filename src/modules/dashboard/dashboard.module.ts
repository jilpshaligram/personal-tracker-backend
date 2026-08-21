import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { DashboardController } from '@/modules/dashboard/dashboard.controller';
import { DashboardService } from '@/modules/dashboard/dashboard.service';

import { Transaction } from '@/modules/transactions/transaction.schema';
import { Category } from '@/modules/categories/category.schema';
import { Budget } from '@/modules/budgets/budget.schema';
import { Document } from '@/modules/documents/document.model';
import { DocumentCategory } from '@/modules/document-category/document-category.model';

import { BillsModule } from '@/modules/bills/bills.module';
import { SavingGoalsModule } from '@/modules/saving-goals/saving-goals.module';
import { WalletsModule } from '@/modules/wallets/wallets.module';

/**
 * @module DashboardModule
 *
 * @description
 
 */
@Module({
  imports: [
    SequelizeModule.forFeature([
      Transaction,
      Category,
      Budget,
      Document,
      DocumentCategory,
    ]),

    BillsModule,
    SavingGoalsModule,
    WalletsModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
