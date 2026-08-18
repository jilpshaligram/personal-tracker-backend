import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { DashboardController } from './controllers/dashboard.controller';
import { DashboardService } from './services/dashboard.service';

import { Transaction } from '../transactions/schemas/transaction.schema';
import { Category } from '../categories/schemas/category.schema';
import { Budget } from '../budgets/schemas/budget.schema';
import { Document } from '../documents/models/document.model';
import { DocumentCategory } from '../document-category/models/document-category.model';

import { BillsModule } from '../bills/bills.module';
import { SavingGoalsModule } from '../saving-goals/saving-goals.module';
import { WalletsModule } from '../wallets/wallets.module';

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
