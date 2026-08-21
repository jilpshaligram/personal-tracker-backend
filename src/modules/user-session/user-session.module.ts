import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { UserSession } from '@/modules/user-session/user-session.schema';
import { UserSessionService } from '@/modules/user-session/user-session.service';

@Module({
  imports: [SequelizeModule.forFeature([UserSession])],
  providers: [UserSessionService],
  exports: [UserSessionService, SequelizeModule],
})
export class UserSessionModule {}
