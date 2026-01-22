import { db, pgp } from '../src/config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runMigrations() {
  try {
    console.log('Starting database migrations...');

    // Create tables
    const migrations = [
      `
        CREATE TABLE IF NOT EXISTS flavors (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          flavor_code VARCHAR(20) UNIQUE NOT NULL,
          flavor_name VARCHAR(255) NOT NULL,
          group_name VARCHAR(100) NOT NULL,
          product_system_id VARCHAR(255),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_flavors_code ON flavors(flavor_code);
        CREATE INDEX IF NOT EXISTS idx_flavors_group ON flavors(group_name);
      `,
      `
        CREATE TABLE IF NOT EXISTS qr_templates (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          template_pattern TEXT NOT NULL,
          description TEXT,
          is_active BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_templates_active ON qr_templates(is_active);
      `,
      `
        CREATE TABLE IF NOT EXISTS qr_protocols (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          serial VARCHAR(255) NOT NULL,
          bill_no VARCHAR(255) NOT NULL,
          barcode VARCHAR(255),
          flavors TEXT,
          sku VARCHAR(255),
          quantity INTEGER,
          price DECIMAL(10, 2),
          protocol_string TEXT NOT NULL,
          template_id UUID REFERENCES qr_templates(id),
          created_at TIMESTAMP DEFAULT NOW(),
          FOREIGN KEY (template_id) REFERENCES qr_templates(id) ON DELETE SET NULL
        );
        CREATE INDEX IF NOT EXISTS idx_protocols_serial ON qr_protocols(serial);
        CREATE INDEX IF NOT EXISTS idx_protocols_billno ON qr_protocols(bill_no);
        CREATE INDEX IF NOT EXISTS idx_protocols_created ON qr_protocols(created_at);
      `,
      `
        CREATE TABLE IF NOT EXISTS sync_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          sync_type VARCHAR(50),
          status VARCHAR(20),
          record_count INTEGER,
          error_message TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_sync_logs_created ON sync_logs(created_at);
      `
    ];

    for (const migration of migrations) {
      await db.none(migration);
    }

    console.log('Database migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    pgp.end();
  }
}

runMigrations();
