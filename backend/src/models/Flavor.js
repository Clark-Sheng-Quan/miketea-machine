import { db } from '../config/database.js';

export class FlavorModel {
  static async getAllFlavors() {
    return db.query(
      'SELECT * FROM flavors ORDER BY flavor_code ASC'
    );
  }

  static async getFlavorById(id) {
    return db.oneOrNone(
      'SELECT * FROM flavors WHERE id = $1',
      [id]
    );
  }

  static async getFlavorByCode(code) {
    return db.oneOrNone(
      'SELECT * FROM flavors WHERE flavor_code = $1',
      [code]
    );
  }

  static async createFlavor(data) {
    const { flavor_code, flavor_name, group_name, product_system_id } = data;
    return db.one(
      `INSERT INTO flavors (flavor_code, flavor_name, group_name, product_system_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING *`,
      [flavor_code, flavor_name, group_name, product_system_id]
    );
  }

  static async updateFlavor(id, data) {
    const { flavor_name, group_name } = data;
    return db.one(
      `UPDATE flavors SET flavor_name = $1, group_name = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [flavor_name, group_name, id]
    );
  }

  static async deleteFlavor(id) {
    return db.result(
      'DELETE FROM flavors WHERE id = $1',
      [id]
    );
  }

  static async getFlavorsByGroup(groupName) {
    return db.query(
      'SELECT * FROM flavors WHERE group_name = $1 ORDER BY flavor_code ASC',
      [groupName]
    );
  }

  static async getFlavorsForPOS() {
    return db.query(
      'SELECT flavor_code, flavor_name, group_name FROM flavors ORDER BY group_name, flavor_code'
    );
  }

  static async syncFlavorsFromProductSystem(flavors) {
    // Upsert flavors from product system
    const flavorCodes = new Set();
    
    for (const flavor of flavors) {
      const code = flavor.flavor_code || this.generateFlavorCode(flavor);
      flavorCodes.add(code);
      
      await db.none(
        `INSERT INTO flavors (flavor_code, flavor_name, group_name, product_system_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         ON CONFLICT (flavor_code) DO UPDATE SET 
         flavor_name = EXCLUDED.flavor_name,
         group_name = EXCLUDED.group_name,
         product_system_id = EXCLUDED.product_system_id,
         updated_at = NOW()`,
        [code, flavor.flavor_name, flavor.group_name, flavor.product_system_id]
      );
    }
    
    return { synced: flavorCodes.size, total: flavors.length };
  }

  static generateFlavorCode(flavor) {
    // Generate code based on group: I=Ice, S=Sugar, T=Temperature
    const groupPrefix = flavor.group_name?.[0]?.toUpperCase() || 'F';
    const timestamp = Date.now().toString().slice(-3);
    return `${groupPrefix}${timestamp}`;
  }
}

export default FlavorModel;
