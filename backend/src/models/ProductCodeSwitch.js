import { db } from '../config/database.js';

export class ProductCodeSwitch {
  // Create table if not exists
  static async initializeTable() {
    try {
      await db.none(`
        CREATE TABLE IF NOT EXISTS product_code_settings (
          business_id VARCHAR(255) PRIMARY KEY,
          enabled BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('product_code_settings table initialized');
    } catch (error) {
      console.error('Failed to initialize product_code_settings table:', error);
      throw error;
    }
  }

  // Get switch status for a business
  static async getSwitch(businessId) {
    try {
      const setting = await db.oneOrNone(
        `SELECT * FROM product_code_settings 
         WHERE business_id = $1;`,
        [businessId]
      );
      
      // If not found, create default (disabled)
      if (!setting) {
        return await this.createSwitch(businessId, false);
      }
      
      return setting;
    } catch (error) {
      console.error('Failed to get product code switch:', error);
      throw error;
    }
  }

  // Create default switch setting
  static async createSwitch(businessId, enabled = false) {
    try {
      const result = await db.one(
        `INSERT INTO product_code_settings (business_id, enabled)
         VALUES ($1, $2)
         ON CONFLICT (business_id) 
         DO UPDATE SET enabled = $2, updated_at = CURRENT_TIMESTAMP
         RETURNING *;`,
        [businessId, enabled]
      );
      return result;
    } catch (error) {
      console.error('Failed to create product code switch:', error);
      throw error;
    }
  }

  // Update switch status
  static async updateSwitch(businessId, enabled) {
    try {
      const result = await db.one(
        `INSERT INTO product_code_settings (business_id, enabled)
         VALUES ($1, $2)
         ON CONFLICT (business_id) 
         DO UPDATE SET enabled = $2, updated_at = CURRENT_TIMESTAMP
         RETURNING *;`,
        [businessId, enabled]
      );
      return result;
    } catch (error) {
      console.error('Failed to update product code switch:', error);
      throw error;
    }
  }
}
