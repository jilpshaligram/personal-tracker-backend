/**
 * @barrel Schemas
 *
 * @description
 * Barrel export for all Sequelize models registered in the Transaction Module.
 *
 * EXPORT ORDER:
 * User and Category are exported before Transaction because Transaction's
 * file imports them. TypeScript resolves this correctly but explicit order
 * avoids potential circular reference warnings in some bundlers.
 *
 * USAGE IN MODULE:
 * SequelizeModule.forFeature([User, Category, Transaction])
 *
 * WHEN STUBS ARE REPLACED:
 * Remove User and Category from this barrel.
 * Import them from their canonical modules instead.
 * Update TransactionModule to import UserModule and CategoryModule.
 */
// export { Category } from './category.model';
export { Transaction } from './transaction.schema';
export { User } from '../../users/schemas/user.schema';
