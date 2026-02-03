import { db, pgp } from '../src/config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function waitForDatabase(maxRetries = 30) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await db.one('SELECT 1');
      console.log('✅ Database connection successful');
      return true;
    } catch (error) {
      console.log(`⏳ Waiting for database... (${i + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  throw new Error('Failed to connect to database after 30 seconds');
}

async function runMigrations() {
  try {
    console.log('Starting database migrations...');

    await waitForDatabase();

    const migrations = [
      // option_item_codes
      `
        CREATE TABLE IF NOT EXISTS option_item_codes (
          business_id VARCHAR(255) NOT NULL,
          option_id VARCHAR(255) NOT NULL,
          option_item_id VARCHAR(255) NOT NULL,
          code VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (business_id, option_item_id)
        );
        CREATE INDEX IF NOT EXISTS idx_option_id ON option_item_codes(option_id);
      `,
      // qr_templates
      `
        CREATE TABLE IF NOT EXISTS qr_templates (
          id VARCHAR(255) PRIMARY KEY,
          business_id VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          template_json JSONB NOT NULL,
          is_active BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_business_id ON qr_templates(business_id);
      `,
      // product_codes
      `
        CREATE TABLE IF NOT EXISTS product_codes (
          business_id VARCHAR(255) NOT NULL,
          product_id VARCHAR(255) NOT NULL,
          code VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (business_id, product_id)
        );
        CREATE INDEX IF NOT EXISTS idx_product_business_id ON product_codes(business_id);
      `,
      // product_code_settings
      `
        CREATE TABLE IF NOT EXISTS product_code_settings (
          business_id VARCHAR(255) PRIMARY KEY,
          enabled BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `
    ];

    for (const migration of migrations) {
      await db.none(migration);
    }

    console.log('✅ Database migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pgp.end();
  }
}

runMigrations();
