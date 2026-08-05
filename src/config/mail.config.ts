import { registerAs } from '@nestjs/config';

export default registerAs('mail', () => ({
  service: process.env.MAIL_SERVICE || process.env.EMAIL_SERVICE || 'gmail',
  host: process.env.MAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.MAIL_PORT ?? '587', 10),
  username: process.env.MAIL_USERNAME || process.env.EMAIL_USER,
  password: process.env.MAIL_PASSWORD || process.env.EMAIL_PASS,
  from:
    process.env.MAIL_FROM ||
    process.env.EMAIL_USER ||
    'noreply@personaltracker.com',
}));
