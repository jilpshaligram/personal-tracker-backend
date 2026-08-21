import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from '@/modules/users/user.schema';
import { UsersController } from '@/modules/users/users.controller';
import { UsersService } from '@/modules/users/users.service';
import { CloudinaryService } from '@/common/cloudinary/cloudinary.service';

@Module({
  imports: [SequelizeModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService, CloudinaryService],
  exports: [UsersService, SequelizeModule],
})
export class UsersModule {}
