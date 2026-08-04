import { registerAs } from '@nestjs/config';

export default registerAs('throttler', () => ({
  ttl: parseInt(process.env.THROTTLER_TTL ?? '60', 10),
  limit: parseInt(process.env.THROTTLER_LIMIT ?? '10', 10),
}));
