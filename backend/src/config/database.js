import pgPromise from 'pg-promise';
import dotenv from 'dotenv';

dotenv.config();

const pgp = pgPromise({
  // Initialization Options
});

const dbName = process.env.DB_NAME;
const dbHost = process.env.DB_HOST;
const dbPort = process.env.DB_PORT;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;

// Connect to postgres database first to create the target database if needed
async function createDatabaseIfNotExists() {
  const initialConfig = {
    host: dbHost,
    port: dbPort,
    database: 'postgres',
    user: dbUser,
    password: dbPassword,
    ssl: {
      rejectUnauthorized: false
    }
  };

  const initialDb = pgp(initialConfig);

  try {
    // Check if database exists
    const result = await initialDb.oneOrNone(
      `SELECT datname FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (!result) {
      console.log(`Database ${dbName} does not exist. Creating...`);
      await initialDb.none(`CREATE DATABASE ${dbName}`);
      console.log(`Database ${dbName} created successfully`);
    } else {
      console.log(`Database ${dbName} already exists`);
    }
  } catch (error) {
    console.error('Error creating database:', error.message);
  } finally {
    await initialDb.$pool.end();
  }
}

const dbConfig = {
  host: dbHost,
  port: dbPort,
  database: dbName,
  user: dbUser,
  password: dbPassword,
  ssl: {
    rejectUnauthorized: false
  }
};

const db = pgp(dbConfig);

export async function initializeDatabase() {
  try {
    // Create database if it doesn't exist
    await createDatabaseIfNotExists();

    // Wait a moment for database to be created
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Now connect to the actual database
    await db.one('SELECT version()');
    console.log('Database connection successful');
  } catch (error) {
    console.error('Database connection failed:', error.message);
    throw error;
  }
}

export { db, pgp };
