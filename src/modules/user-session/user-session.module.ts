import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { UserSession } from './schemas/user-session.schema';
import { UserSessionService } from './services/user-session.service';

@Module({
  imports: [SequelizeModule.forFeature([UserSession])],
  providers: [UserSessionService],
  exports: [UserSessionService, SequelizeModule],
})
export class UserSessionModule {}
