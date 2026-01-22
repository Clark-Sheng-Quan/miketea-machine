import { db, pgp } from '../src/config/database.js';

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');

    // Seed default QR template
    const template = await db.one(
      `INSERT INTO qr_templates (name, template_pattern, description, is_active)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT DO NOTHING
       RETURNING *`,
      [
        'Default Protocol',
        '{serial}|{billNo}|{barcode}|{flavors}|{sku}',
        'Default QR protocol template for milk tea orders',
        true
      ]
    ).catch(() => null);

    if (template) {
      console.log('Default template created:', template.id);
    }

    // Seed sample flavors
    const sampleFlavors = [
      { flavor_code: 'I001', flavor_name: 'Ice', group_name: 'Temperature' },
      { flavor_code: 'I002', flavor_name: 'No Ice', group_name: 'Temperature' },
      { flavor_code: 'S001', flavor_name: 'Normal Sugar', group_name: 'Sugar' },
      { flavor_code: 'S002', flavor_name: 'Less Sugar', group_name: 'Sugar' },
      { flavor_code: 'S003', flavor_name: 'No Sugar', group_name: 'Sugar' },
      { flavor_code: 'T001', flavor_name: 'Hot', group_name: 'Temperature' },
      { flavor_code: 'O001', flavor_name: 'Pearl', group_name: 'Toppings' },
      { flavor_code: 'O002', flavor_name: 'Pudding', group_name: 'Toppings' }
    ];

    let inserted = 0;
    for (const flavor of sampleFlavors) {
      const result = await db.result(
        `INSERT INTO flavors (flavor_code, flavor_name, group_name)
         VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING`,
        [flavor.flavor_code, flavor.flavor_name, flavor.group_name]
      ).catch(() => ({ rowCount: 0 }));

      if (result.rowCount > 0) {
        inserted++;
      }
    }

    console.log(`Inserted ${inserted} sample flavors`);
    console.log('Database seeding completed successfully');
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    pgp.end();
  }
}

seedDatabase();
