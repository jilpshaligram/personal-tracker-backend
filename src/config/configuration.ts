export default () => ({
  app: {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT ?? '3000', 10),
    name: process.env.APP_NAME || 'Personal Document Expense Tracker',
  },
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
  auth: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY || '10m',
    refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY || '30d',
    onboardingTokenExpiry: process.env.ONBOARDING_TOKEN_EXPIRY || '5m',
  },
  mail: {
    service: process.env.MAIL_SERVICE || process.env.EMAIL_SERVICE || 'gmail',
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.MAIL_PORT ?? '587', 10),
    username: process.env.MAIL_USERNAME || process.env.EMAIL_USER,
    password: process.env.MAIL_PASSWORD || process.env.EMAIL_PASS,
    from:
      process.env.MAIL_FROM ||
      process.env.EMAIL_USER ||
      'noreply@personaltracker.com',
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  throttler: {
    ttl: parseInt(process.env.THROTTLER_TTL ?? '60', 10),
    limit: parseInt(process.env.THROTTLER_LIMIT ?? '10', 10),
  },
  swagger: {
    title: 'Personal Document Expense Tracker API',
    description: 'The API description for the tracker application',
    version: '1.0',
    path: 'api/docs',
  },
});
