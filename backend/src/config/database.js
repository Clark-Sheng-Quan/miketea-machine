import pgPromise from 'pg-promise';
import dotenv from 'dotenv';

dotenv.config();

const pgp = pgPromise({
  // Initialization Options
});

const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
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
