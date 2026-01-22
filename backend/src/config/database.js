import pgPromise from 'pg-promise';
import dotenv from 'dotenv';

dotenv.config();

const pgp = pgPromise({
  // Initialization Options
});

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'miketea_machine',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
};

const db = pgp(dbConfig);

export async function initializeDatabase() {
  try {
    await db.one('SELECT version()');
    console.log('Database connection successful');
  } catch (error) {
    console.error('Database connection failed:', error.message);
    throw error;
  }
}

export { db, pgp };
