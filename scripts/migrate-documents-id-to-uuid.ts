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

  await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

  // Check current column type of documents.id
  const checkRes = await client.query(`
    SELECT data_type FROM information_schema.columns 
    WHERE table_name = 'documents' AND column_name = 'id';
  `);

  if (checkRes.rows.length > 0 && checkRes.rows[0].data_type !== 'uuid') {
    console.log('Altering documents.id column to UUID...');
    await client.query(`
      ALTER TABLE documents ALTER COLUMN id DROP DEFAULT;
      ALTER TABLE documents ALTER COLUMN id TYPE UUID USING (gen_random_uuid());
      ALTER TABLE documents ALTER COLUMN id SET DEFAULT gen_random_uuid();
    `);
    console.log('Successfully updated documents.id to UUID!');
  } else {
    console.log('documents.id is already UUID.');
  }

  await client.end();
}

run().catch((err) => {
  console.error('Error migrating documents id to UUID:', err);
  process.exit(1);
});
