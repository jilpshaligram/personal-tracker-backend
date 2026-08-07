import * as path from 'path';
import * as dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const DOCUMENT_CATEGORIES: string[] = [

  'Identity Documents',
  'Passport & Visa',
  'Driving License',
  'PAN Card',
  'Aadhaar Card',
  'Voter ID',

  'Bank Statements',
  'Investment Documents',
  'Loan Documents',
  'Credit Card Statements',
  'Tax Returns (ITR)',
  'Form 16 / Salary Slips',
  'Provident Fund (PF)',

  'Life Insurance',
  'Health Insurance',
  'Vehicle Insurance',
  'Home Insurance',
  'Travel Insurance',

  'Property Documents',
  'Vehicle Documents',
  'Rental Agreements',
  'Sale Deeds',

  'Medical Records',
  'Prescriptions',
  'Health Reports',
  'Vaccination Records',

  'Legal Contracts',
  'Court Documents',
  'Affidavits',
  'Power of Attorney',
  'Wills & Nominations',

  'Educational Certificates',
  'Marksheets',
  'Admission Letters',
  'Scholarship Documents',

  'Employment Documents',
  'Offer Letters',
  'Experience Letters',
  'Business Registration',
  'GST Documents',

  'Utility Bills',
  'Mobile & Internet Bills',
  'Electricity Bills',
  'Water Bills',

  'Receipts & Invoices',
  'Warranties & Manuals',
  'Miscellaneous',
];

async function run(): Promise<void> {
  const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

  if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME) {
    console.error(
      '❌  Missing required database environment variables.\n' +
      '    Ensure DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, and DB_NAME are set in .env',
    );
    process.exit(1);
  }

  const client = new Client({
    host: DB_HOST,
    port: DB_PORT ? parseInt(DB_PORT, 10) : 5432,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
  });

  console.log('🔌  Connecting to the database...');
  await client.connect();
  console.log(`✅  Connected to "${DB_NAME}" on ${DB_HOST}:${DB_PORT ?? 5432}`);

  let inserted = 0;
  let skipped = 0;

  try {

    await client.query(`
      CREATE TABLE IF NOT EXISTS document_categories (
        id          SERIAL PRIMARY KEY,
        name        VARCHAR(255) NOT NULL UNIQUE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);
    console.log('📋  Table "document_categories" is ready.');

    console.log('\n📂  Seeding document categories...\n');

    for (const name of DOCUMENT_CATEGORIES) {
      const result = await client.query<{ id: number }>(
        `INSERT INTO document_categories (name, "createdAt", "updatedAt")
         VALUES ($1, NOW(), NOW())
         ON CONFLICT (name) DO NOTHING
         RETURNING id`,
        [name],
      );

      if (result.rowCount && result.rowCount > 0) {
        console.log(`  ✔  Inserted: "${name}" (id: ${result.rows[0].id})`);
        inserted++;
      } else {
        console.log(`  –  Skipped (already exists): "${name}"`);
        skipped++;
      }
    }
  } finally {
    await client.end();
    console.log('\n🔌  Database connection closed.');
  }

  console.log('\n─────────────────────────────────────────');
  console.log(`  Document categories seeded successfully`);
  console.log(`  Inserted : ${inserted}`);
  console.log(`  Skipped  : ${skipped}`);
  console.log(`  Total    : ${DOCUMENT_CATEGORIES.length}`);
  console.log('─────────────────────────────────────────\n');
}

void run().catch((err: unknown) => {
  console.error('❌  Seeder failed:', err);
  process.exit(1);
});
