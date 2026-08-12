import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: Transporter | null = null;
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly configService: ConfigService) {}

  private getTransporter(): Transporter {
    if (this.transporter) return this.transporter;

    const service = this.configService.get<string>('mail.service');
    const host =
      this.configService.get<string>('mail.host') ?? 'smtp.gmail.com';
    const port = this.configService.get<number>('mail.port') ?? 587;
    const user = this.configService.get<string>('mail.username');
    const pass = this.configService.get<string>('mail.password');

    this.logger.log(
      `Initializing mail transporter: service=${service ?? 'none'}, user=${user ?? '(none)'}`,
    );

    if (service) {
      this.transporter = nodemailer.createTransport({
        service,
        auth: user && pass ? { user, pass } : undefined,
        tls: {
          rejectUnauthorized: false,
        },
      });
    } else {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: user && pass ? { user, pass } : undefined,
        tls: {
          rejectUnauthorized: false,
        },
      });
    }

    return this.transporter;
  }

  private get fromAddress(): string {
    return (
      this.configService.get<string>('mail.from') ??
      this.configService.get<string>('mail.username') ??
      'noreply@personaltracker.com'
    );
  }

  async sendOtpEmail(to: string, otp: string, purpose: string): Promise<void> {
    const subject = this.getSubjectByPurpose(purpose);
    const html = this.buildOtpEmailTemplate(otp, purpose);

    await this.getTransporter().sendMail({
      from: this.fromAddress,
      to,
      subject,
      html,
    });

    this.logger.log(`OTP email sent to ${to} for purpose: ${purpose}`);
  }

  private getSubjectByPurpose(purpose: string): string {
    const subjects: Record<string, string> = {
      EMAIL_VERIFICATION: 'Verify your email address',
      PASSWORD_RESET: 'Reset your password',
      PIN_RESET: 'Reset your security PIN',
      LOGIN: 'Your login OTP',
    };
    return subjects[purpose] ?? 'Your OTP code';
  }

  private buildOtpEmailTemplate(otp: string, purpose: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>OTP Verification</title>
      </head>
      <body style="margin:0;padding:0;background:#f4f4f7;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:30px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                <tr>
                  <td style="background:#4f46e5;padding:32px;text-align:center;">
                    <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">Personal Tracker</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:40px 32px;">
                    <h2 style="color:#1a1a2e;margin:0 0 16px;font-size:20px;">Your Verification Code</h2>
                    <p style="color:#555;line-height:1.6;margin:0 0 24px;">
                      Use the following OTP to complete your ${this.formatPurpose(purpose)}.
                      This code expires in <strong>10 minutes</strong>.
                    </p>
                    <div style="background:#f0efff;border-radius:8px;padding:24px;text-align:center;margin:0 0 24px;">
                      <span style="font-size:40px;font-weight:700;letter-spacing:12px;color:#4f46e5;">${otp}</span>
                    </div>
                    <p style="color:#999;font-size:13px;margin:0;">
                      If you did not request this, please ignore this email. Do not share this OTP with anyone.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background:#f9f9fb;padding:20px 32px;text-align:center;border-top:1px solid #eee;">
                    <p style="color:#aaa;font-size:12px;margin:0;">&copy; ${new Date().getFullYear()} Personal Tracker. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  private formatPurpose(purpose: string): string {
    const labels: Record<string, string> = {
      EMAIL_VERIFICATION: 'email verification',
      PASSWORD_RESET: 'password reset',
      PIN_RESET: 'PIN reset',
      LOGIN: 'login',
    };
    return labels[purpose] ?? 'verification';
  }
}
