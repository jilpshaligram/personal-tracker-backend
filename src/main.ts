import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const cookieParser = require('cookie-parser') as () => ReturnType<
  typeof import('cookie-parser')
>;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.setGlobalPrefix('api/v1');
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
