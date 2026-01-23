import { db } from '../config/database.js';

export class OptionItemCode {
  // Create table if not exists
  static async initializeTable() {
    try {
      await db.none(`
        CREATE TABLE IF NOT EXISTS option_item_codes (
          business_id VARCHAR(255) NOT NULL,
          option_id VARCHAR(255) NOT NULL,
          option_item_id VARCHAR(255) NOT NULL,
          code VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (business_id, option_item_id)
        );
        
        CREATE INDEX IF NOT EXISTS idx_option_id ON option_item_codes(option_id);
      `);
      console.log('option_item_codes table initialized');
    } catch (error) {
      console.error('Failed to initialize option_item_codes table:', error);
      throw error;
    }
  }

  // Save or update item codes
  static async saveItemCodes(businessId, itemCodes) {
    try {
      // itemCodes is an array: [{ optionId, optionItemId, code }, ...]
      const result = [];

      for (const item of itemCodes) {
        const { optionId, optionItemId, code } = item;

        try {
          const savedItem = await db.one(
            `INSERT INTO option_item_codes (business_id, option_id, option_item_id, code)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (business_id, option_item_id) 
             DO UPDATE SET code = $4, updated_at = CURRENT_TIMESTAMP
             RETURNING *;`,
            [businessId, optionId, optionItemId, code]
          );

          result.push(savedItem);
          console.log(`[OptionItemCode] Saved: ${optionItemId} -> ${code}`);
        } catch (itemError) {
          console.error(`[OptionItemCode] Failed to save item ${optionItemId}:`, itemError.message);
          throw itemError;
        }
      }

      console.log(`[OptionItemCode] Successfully saved all ${result.length} codes`);
      return result;
    } catch (error) {
      console.error('Failed to save item codes:', error.message);
      throw error;
    }
  }

  // Get all item codes for a business
  static async getItemCodesByBusinessId(businessId) {
    try {
      const codes = await db.manyOrNone(
        `SELECT * FROM option_item_codes 
         WHERE business_id = $1 
         ORDER BY option_id, option_item_id;`,
        [businessId]
      );
      return codes || [];
    } catch (error) {
      console.error('Failed to get item codes:', error);
      throw error;
    }
  }

  // Get item codes for a specific option
  static async getItemCodesByOptionId(businessId, optionId) {
    try {
      const codes = await db.manyOrNone(
        `SELECT * FROM option_item_codes 
         WHERE business_id = $1 AND option_id = $2 
         ORDER BY option_item_id;`,
        [businessId, optionId]
      );
      return codes || [];
    } catch (error) {
      console.error('Failed to get item codes by option:', error);
      throw error;
    }
  }

  // Get code for a single item
  static async getItemCode(businessId, optionItemId) {
    try {
      const code = await db.oneOrNone(
        `SELECT * FROM option_item_codes 
         WHERE business_id = $1 AND option_item_id = $2;`,
        [businessId, optionItemId]
      );
      return code;
    } catch (error) {
      console.error('Failed to get item code:', error);
      throw error;
    }
  }

  // Delete item code
  static async deleteItemCode(businessId, optionItemId) {
    try {
      await db.none(
        `DELETE FROM option_item_codes 
         WHERE business_id = $1 AND option_item_id = $2;`,
        [businessId, optionItemId]
      );
    } catch (error) {
      console.error('Failed to delete item code:', error);
      throw error;
    }
  }
}
