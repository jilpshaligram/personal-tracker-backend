import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from './schemas/user.schema';
import { UsersController } from './controllers/users.controller';
import { UsersService } from './services/users.service';
import { SecurityModule } from '../../infrastructure/security/security.module';

@Module({
  imports: [SequelizeModule.forFeature([User]), SecurityModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, SequelizeModule],
})
export class UsersModule {}
