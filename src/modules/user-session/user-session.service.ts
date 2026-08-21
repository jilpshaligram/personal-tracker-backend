import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UserSession } from '@/modules/user-session/user-session.schema';
import { IDeviceInfo } from '@/modules/user-session/interfaces/device-info.interface';

const REFRESH_TOKEN_DAYS = 30;

export interface CreateSessionData {
  userId: string;
  hashedRefreshToken: string;
  deviceInfo: IDeviceInfo;
  loginMethod?: string;
}

@Injectable()
export class UserSessionService {
  constructor(
    @InjectModel(UserSession)
    private readonly sessionModel: typeof UserSession,
  ) {}

  async createSession(data: CreateSessionData): Promise<UserSession> {
    const expiresAt = new Date(
      Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000,
    );

    return this.sessionModel.create({
      userId: data.userId,
      refreshToken: data.hashedRefreshToken,
      device: data.deviceInfo.userAgent ?? null,
      loginMethod: data.loginMethod ?? 'email_pin',
      isActive: true,
      expiresAt,
      lastActivityAt: new Date(),
    });
  }

  async findActiveSessionById(sessionId: string): Promise<UserSession | null> {
    return this.sessionModel.findOne({
      where: { id: sessionId, isActive: true },
    });
  }

  async findActiveSessionsByUserId(userId: string): Promise<UserSession[]> {
    return this.sessionModel.findAll({
      where: { userId, isActive: true },
    });
  }

  async updateSessionToken(
    sessionId: string,
    hashedRefreshToken: string,
  ): Promise<void> {
    const expiresAt = new Date(
      Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000,
    );
    await this.sessionModel.update(
      {
        refreshToken: hashedRefreshToken,
        lastActivityAt: new Date(),
        expiresAt,
      },
      { where: { id: sessionId } },
    );
  }

  async revokeSession(sessionId: string): Promise<void> {
    await this.sessionModel.update(
      { isActive: false, loggedOutAt: new Date() },
      { where: { id: sessionId } },
    );
  }

  async revokeAllSessionsByUserId(userId: string): Promise<void> {
    await this.sessionModel.update(
      { isActive: false, loggedOutAt: new Date() },
      { where: { userId, isActive: true } },
    );
  }
}
