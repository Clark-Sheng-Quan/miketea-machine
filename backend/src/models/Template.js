import { db } from '../config/database.js';

export class Template {
  // Create table if not exists
  static async initializeTable() {
    try {
      await db.none(`
        CREATE TABLE IF NOT EXISTS qr_templates (
          id VARCHAR(255) PRIMARY KEY,
          business_id VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          template_json JSONB NOT NULL,
          is_active BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_business_id ON qr_templates(business_id);
      `);
      console.log('qr_templates table initialized');
    } catch (error) {
      console.error('Failed to initialize qr_templates table:', error);
      throw error;
    }
  }

  // Get all formulas for a business
  static async getAllFormulas(businessId) {
    try {
      const templates = await db.manyOrNone(
        `SELECT * FROM qr_templates 
         WHERE business_id = $1 
         ORDER BY name;`,
        [businessId]
      );
      return templates || [];
    } catch (error) {
      console.error('Failed to get templates:', error);
      throw error;
    }
  }

  // Get active template for a business
  static async getActive(businessId) {
    try {
      const template = await db.oneOrNone(
        `SELECT * FROM qr_templates 
         WHERE business_id = $1 AND is_active = true
         LIMIT 1;`,
        [businessId]
      );
      return template;
    } catch (error) {
      console.error('Failed to get active template:', error);
      throw error;
    }
  }

  // Create a new formula
  static async createFormula(businessId, name, templateJson) {
    try {
      const id = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const template = await db.one(
        `INSERT INTO qr_templates (id, business_id, name, template_json)
         VALUES ($1, $2, $3, $4)
         RETURNING *;`,
        [id, businessId, name, JSON.stringify(templateJson)]
      );
      
      return template;
    } catch (error) {
      console.error('Failed to create template:', error);
      throw error;
    }
  }

  // Update a formula
  static async updateFormula(id, name, templateJson, isActive) {
    try {
      const template = await db.one(
        `UPDATE qr_templates 
         SET name = $2, template_json = $3, is_active = $4, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *;`,
        [id, name, JSON.stringify(templateJson), isActive]
      );
      
      return template;
    } catch (error) {
      console.error('Failed to update template:', error);
      throw error;
    }
  }

  // Delete a template
  static async delete(id) {
    try {
      await db.none(
        `DELETE FROM qr_templates WHERE id = $1;`,
        [id]
      );
    } catch (error) {
      console.error('Failed to delete template:', error);
      throw error;
    }
  }
}
