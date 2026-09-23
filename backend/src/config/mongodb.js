import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const databaseName = process.env.MONGODB_DATABASE || 'miketea_machine';
const client = new MongoClient(mongoUri);
let database;

export async function initializeDatabase() {
  await client.connect();
  database = client.db(databaseName);

  await Promise.all([
    database.collection('product_codes').createIndex(
      { business_id: 1, product_id: 1 },
      { unique: true }
    ),
    database.collection('option_item_codes').createIndex(
      { business_id: 1, option_item_id: 1 },
      { unique: true }
    ),
    database.collection('qr_templates').createIndex({ business_id: 1 }),
    database.collection('product_code_settings').createIndex(
      { business_id: 1 },
      { unique: true }
    )
  ]);

  await database.command({ ping: 1 });
  console.log(`MongoDB connection successful: ${databaseName}`);
}

export function getCollection(name) {
  if (!database) {
    throw new Error('MongoDB has not been initialized');
  }

  return database.collection(name);
}

export { client };
