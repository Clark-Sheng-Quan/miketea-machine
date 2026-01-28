import { db } from '../config/database.js';

export class ProductCode {
  // Create table if not exists
  static async initializeTable() {
    try {
      await db.none(`
        CREATE TABLE IF NOT EXISTS product_codes (
          business_id VARCHAR(255) NOT NULL,
          product_id VARCHAR(255) NOT NULL,
          code VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (business_id, product_id)
        );
        
        CREATE INDEX IF NOT EXISTS idx_product_business_id ON product_codes(business_id);
      `);
      console.log('product_codes table initialized');
    } catch (error) {
      console.error('Failed to initialize product_codes table:', error);
      throw error;
    }
  }

  // Save or update product code
  static async saveProductCode(businessId, productId, code) {
    try {
      const result = await db.one(
        `INSERT INTO product_codes (business_id, product_id, code)
         VALUES ($1, $2, $3)
         ON CONFLICT (business_id, product_id) 
         DO UPDATE SET code = $3, updated_at = CURRENT_TIMESTAMP
         RETURNING *;`,
        [businessId, productId, code]
      );
      return result;
    } catch (error) {
      console.error('Failed to save product code:', error);
      throw error;
    }
  }

  // Get all product codes for a business
  static async getAllProductCodes(businessId) {
    try {
      const codes = await db.manyOrNone(
        `SELECT * FROM product_codes 
         WHERE business_id = $1 
         ORDER BY created_at;`,
        [businessId]
      );
      return codes || [];
    } catch (error) {
      console.error('Failed to get product codes:', error);
      throw error;
    }
  }

  // Get product code by product ID
  static async getProductCode(businessId, productId) {
    try {
      const code = await db.oneOrNone(
        `SELECT * FROM product_codes 
         WHERE business_id = $1 AND product_id = $2;`,
        [businessId, productId]
      );
      return code;
    } catch (error) {
      console.error('Failed to get product code:', error);
      throw error;
    }
  }

  // Save multiple product codes
  static async saveProductCodes(businessId, productCodes) {
    try {
      const values = productCodes.map((item, index) => {
        const offset = index * 3;
        return `($${offset + 1}, $${offset + 2}, $${offset + 3})`;
      }).join(',');

      const flatParams = productCodes.flatMap(item => [businessId, item.productId, item.code]);

      await db.none(
        `INSERT INTO product_codes (business_id, product_id, code) VALUES ${values}
         ON CONFLICT (business_id, product_id) 
         DO UPDATE SET code = EXCLUDED.code, updated_at = CURRENT_TIMESTAMP;`,
        flatParams
      );

      return { success: true, count: productCodes.length };
    } catch (error) {
      console.error('Failed to save product codes:', error);
      throw error;
    }
  }

  // Delete product code
  static async deleteProductCode(businessId, productId) {
    try {
      await db.none(
        `DELETE FROM product_codes 
         WHERE business_id = $1 AND product_id = $2;`,
        [businessId, productId]
      );
    } catch (error) {
      console.error('Failed to delete product code:', error);
      throw error;
    }
  }
}
