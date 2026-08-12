/**
 * =============================================================================
 * SEED SCRIPT: seed-test-users.ts
 * =============================================================================
 *
 * PURPOSE:
 * Creates test users directly in PostgreSQL for development and API testing.
 * This script exists ONLY to support local development and Postman testing
 * of the Transaction Module.
 *
 * ⚠️  WARNING: DO NOT RUN IN PRODUCTION.
 * ⚠️  DO NOT COMMIT REAL CREDENTIALS.
 * ⚠️  REMOVE OR DISABLE THIS SCRIPT BEFORE PRODUCTION DEPLOYMENT.
 *
 * HOW TO RUN:
 *   npx ts-node -r tsconfig-paths/register scripts/seed-test-users.ts
 *
 * WHAT IT DOES:
 * - Connects to PostgreSQL using your .env credentials
 * - Creates a `users` table if it does not exist (safe schema bootstrap)
 * - Inserts 3 test users with bcrypt-hashed passwords
 * - Uses ON CONFLICT DO NOTHING — safe to run multiple times (idempotent)
 *
 * TEST CREDENTIALS (for Postman):
 * ┌──────────────────────┬───────────────┬────────────┬──────────────────────┐
 * │ Name                 │ Email         │ Password   │ Purpose              │
 * ├──────────────────────┼───────────────┼────────────┼──────────────────────┤
 * │ Alice Sharma         │ alice@test.com│ Test@1234  │ Primary test user    │
 * │ Bob Mehta            │ bob@test.com  │ Test@1234  │ Ownership validation │
 * │ Charlie Dev          │ charlie@test.com│ Test@1234 │ Isolation testing   │
 * └──────────────────────┴───────────────┴────────────┴──────────────────────┘
 *
 * DEPENDENCIES:
 * - pg     : PostgreSQL client (already in package.json)
 * - bcrypt : password hashing — native, fully typed (already installed)
 * - dotenv : reads .env — loaded automatically via ts-node
 *
 * =============================================================================
 */

import * as dotenv from 'dotenv';
import { Client } from 'pg';
import * as bcrypt from 'bcrypt';

// Load environment variables from .env
dotenv.config();

// ─── Database Connection ────────────────────────────────────────────────────

const client = new Client({
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// ─── Test Users Definition ──────────────────────────────────────────────────

interface SeedUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  plain_password: string;
  is_active: boolean;
  is_email_verified: boolean;
}

/**
 * Fixed UUIDs for test users.
 * Using fixed UUIDs means you can hardcode them in Postman environments
 * and use them as FK references when testing transactions.
 */
const TEST_USERS: SeedUser[] = [
  {
    id: 'a1b2c3d4-0001-0001-0001-000000000001',
    first_name: 'Alice',
    last_name: 'Sharma',
    email: 'alice@test.com',
    plain_password: 'Test@1234',
    is_active: true,
    is_email_verified: true,
  },
  {
    id: 'b2c3d4e5-0002-0002-0002-000000000002',
    first_name: 'Bob',
    last_name: 'Mehta',
    email: 'bob@test.com',
    plain_password: 'Test@1234',
    is_active: true,
    is_email_verified: true,
  },
  {
    id: 'c3d4e5f6-0003-0003-0003-000000000003',
    first_name: 'Charlie',
    last_name: 'Dev',
    email: 'charlie@test.com',
    plain_password: 'Test@1234',
    is_active: true,
    is_email_verified: true,
  },
];

// ─── Bootstrap Table (Development Safety Net) ───────────────────────────────

/**
 * Creates the users table if it does not exist.
 *
 * NOTE: This is a minimal schema for TESTING ONLY.
 * The real users table will be created by your production migration.
 * This ensures the seeder works even before migrations run.
 *
 * Columns match what the Transaction Module expects via FK:
 *   transactions.user_id → users.id (UUID)
 */
async function bootstrapUsersTable(): Promise<void> {
  await client.query(`
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    CREATE TABLE IF NOT EXISTS users (
      id                 UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
      first_name         VARCHAR(100)  NOT NULL,
      last_name          VARCHAR(100)  NOT NULL,
      email              VARCHAR(255)  NOT NULL,
      password           VARCHAR(255)  NOT NULL,
      is_active          BOOLEAN       NOT NULL DEFAULT true,
      is_email_verified  BOOLEAN       NOT NULL DEFAULT false,
      created_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
      updated_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
      deleted_at         TIMESTAMPTZ   NULL,

      CONSTRAINT users_email_unique UNIQUE (email)
    );
  `);

  console.log('✅  users table ready (created if not exists)');
}

// ─── Seed Logic ─────────────────────────────────────────────────────────────

/**
 * Hashes a plain text password using bcrypt.
 * Salt rounds = 12 — standard for production-equivalent testing.
 *
 * @param plainPassword - The plain text password to hash
 * @returns bcrypt hash string
 */
async function hashPassword(plainPassword: string): Promise<string> {
  const SALT_ROUNDS = 12;
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

/**
 * Inserts all test users into the database.
 * Uses ON CONFLICT DO NOTHING — idempotent, safe to run multiple times.
 *
 * @param users - Array of seed user definitions
 */
async function seedUsers(users: SeedUser[]): Promise<void> {
  console.log('\n📦  Seeding test users...\n');

  for (const user of users) {
    const hashedPassword = await hashPassword(user.plain_password);

    await client.query(
      `
      INSERT INTO users (
        id,
        first_name,
        last_name,
        email,
        password,
        is_active,
        is_email_verified,
        created_at,
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, NOW(), NOW()
      )
      ON CONFLICT (email) DO NOTHING;
      `,
      [
        user.id,
        user.first_name,
        user.last_name,
        user.email,
        hashedPassword,
        user.is_active,
        user.is_email_verified,
      ],
    );

    console.log(
      `  ✅  ${user.first_name} ${user.last_name} | ${user.email} | ID: ${user.id}`,
    );
  }
}

// ─── Summary Output ─────────────────────────────────────────────────────────

/**
 * Prints a clean summary table after seeding.
 * Useful for copying UUIDs into Postman environment variables.
 */
function printSummary(users: SeedUser[]): void {
  console.log('\n');
  console.log('='.repeat(70));
  console.log('  TEST USER CREDENTIALS — USE IN POSTMAN');
  console.log('='.repeat(70));
  console.log('  Password for ALL users: Test@1234');
  console.log('-'.repeat(70));
  for (const user of users) {
    console.log(`  Name  : ${user.first_name} ${user.last_name}`);
    console.log(`  Email : ${user.email}`);
    console.log(`  UUID  : ${user.id}`);
    console.log('-'.repeat(70));
  }
  console.log(
    '  ⚠️  These users are for LOCAL TESTING ONLY. DO NOT use in production.',
  );
  console.log('='.repeat(70));
  console.log('\n');
}

// ─── Entry Point ─────────────────────────────────────────────────────────────

async function run(): Promise<void> {
  console.log('\n🚀  Starting test user seeder...');
  console.log(`    Database : ${process.env.DB_NAME ?? 'unknown'}`);
  console.log(`    Host     : ${process.env.DB_HOST ?? 'localhost'}:${process.env.DB_PORT ?? '5432'}`);

  try {
    await client.connect();
    console.log('✅  Connected to PostgreSQL\n');

    await bootstrapUsersTable();
    await seedUsers(TEST_USERS);
    printSummary(TEST_USERS);

    console.log('🎉  Seeding complete!\n');
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('\n❌  Seeder failed:', error.message);
      console.error('    Stack:', error.stack);
    } else {
      console.error('\n❌  Seeder failed with unknown error');
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

void run();
