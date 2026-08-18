import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.enableCors({
    origin: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Personal Tracker API')
    .setDescription(
      'REST API documentation for Personal Tracker Backend — manage transactions, budgets, bills, saving goals, documents, and user accounts.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT access token or rely on access_token cookie',
        in: 'header',
      },
      'access-token',
    )
    .addTag('Auth', 'Authentication & session management')
    .addTag('Users', 'User profile operations')
    .addTag('Transactions', 'Income & expense transactions')
    .addTag('Budgets', 'Budget management')
    .addTag('Bills', 'Bill tracking')
    .addTag('Bill History', 'Payment history for bills')
    .addTag('Saving Goals', 'Saving goals & progress')
    .addTag('Saving Transactions', 'Saving goal contributions & withdrawals')
    .addTag('Wallets', 'Wallet management')
    .addTag('Categories', 'Transaction categories')
    .addTag('Document Categories', 'Document categorization')
    .addTag('Documents', 'Document vault storage')
    .addTag('Reports', 'Financial reports')
    .addTag('Dashboard', 'Dashboard analytics')
    .addTag('Notifications', 'User notifications')
    .addTag('Audit Logs', 'Activity audit logs')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha'
    },
    customSiteTitle: 'Personal Tracker API Docs',
  });

  await app.listen(process.env.PORT ?? 3001);
}

void bootstrap();
