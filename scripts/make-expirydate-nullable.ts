import * as path from 'path';
import * as dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function run(): Promise<void> {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD ? process.env.DB_PASSWORD.replace(/^'|'$/g, '') : '',
    database: process.env.DB_NAME,
  });

  await client.connect();
  console.log('Connecting to database...');

  await client.query(`
    ALTER TABLE documents ALTER COLUMN "expiryDate" DROP NOT NULL;
  `);

  console.log('Successfully dropped NOT NULL constraint on "expiryDate" column in "documents" table!');
  await client.end();
}

run().catch((err) => {
  console.error('Error altering column:', err);
  process.exit(1);
});
