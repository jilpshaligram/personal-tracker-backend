import { registerAs } from '@nestjs/config';

export default registerAs('swagger', () => ({
  title: 'Personal Document Expense Tracker API',
  description: 'The API description for the tracker application',
  version: '1.0',
  path: 'api/docs',
}));
