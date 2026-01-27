import { db } from './src/config/database.js';

async function queryAllTables() {
  try {
    console.log('========== DATABASE TABLES CONTENT ==========\n');

    // 1. product_codes
    console.log('--- TABLE: product_codes ---');
    const productCodes = await db.manyOrNone('SELECT * FROM product_codes;');
    console.log('Count:', productCodes?.length || 0);
    console.log(JSON.stringify(productCodes, null, 2));
    console.log('');

    // 2. option_item_codes
    console.log('--- TABLE: option_item_codes ---');
    const optionItemCodes = await db.manyOrNone('SELECT * FROM option_item_codes;');
    console.log('Count:', optionItemCodes?.length || 0);
    console.log(JSON.stringify(optionItemCodes, null, 2));
    console.log('');

    // 3. product_code_settings
    console.log('--- TABLE: product_code_settings ---');
    const productCodeSettings = await db.manyOrNone('SELECT * FROM product_code_settings;');
    console.log('Count:', productCodeSettings?.length || 0);
    console.log(JSON.stringify(productCodeSettings, null, 2));
    console.log('');

    // 4. qr_templates
    console.log('--- TABLE: qr_templates ---');
    const qrTemplates = await db.manyOrNone('SELECT * FROM qr_templates;');
    console.log('Count:', qrTemplates?.length || 0);
    console.log(JSON.stringify(qrTemplates, null, 2));
    console.log('');

    console.log('========== END OF QUERY ==========');
    process.exit(0);
  } catch (error) {
    console.error('Query error:', error.message);
    process.exit(1);
  }
}

queryAllTables();
