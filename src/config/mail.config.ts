import { registerAs } from '@nestjs/config';

export default registerAs('mail', () => ({
  host: process.env.MAIL_HOST || 'smtp.mailtrap.io',
  port: parseInt(process.env.MAIL_PORT ?? '2525', 10),
  username: process.env.MAIL_USERNAME,
  password: process.env.MAIL_PASSWORD,
  from: process.env.MAIL_FROM || 'noreply@personaltracker.com',
}));
