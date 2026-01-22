import { db } from '../config/database.js';

export class TemplateModel {
  static async getAllTemplates() {
    return db.query(
      'SELECT * FROM qr_templates ORDER BY created_at DESC'
    );
  }

  static async getTemplateById(id) {
    return db.oneOrNone(
      'SELECT * FROM qr_templates WHERE id = $1',
      [id]
    );
  }

  static async getActiveTemplate() {
    return db.oneOrNone(
      'SELECT * FROM qr_templates WHERE is_active = true ORDER BY created_at DESC LIMIT 1'
    );
  }

  static async createTemplate(data) {
    const { name, template_pattern, description, is_active } = data;
    return db.one(
      `INSERT INTO qr_templates (name, template_pattern, description, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING *`,
      [name, template_pattern, description, is_active || false]
    );
  }

  static async updateTemplate(id, data) {
    const { name, template_pattern, description, is_active } = data;
    return db.one(
      `UPDATE qr_templates 
       SET name = $1, template_pattern = $2, description = $3, is_active = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [name, template_pattern, description, is_active, id]
    );
  }

  static async deleteTemplate(id) {
    return db.result(
      'DELETE FROM qr_templates WHERE id = $1',
      [id]
    );
  }

  static async activateTemplate(id) {
    // Deactivate all other templates
    await db.none('UPDATE qr_templates SET is_active = false');
    
    // Activate the selected template
    return db.one(
      'UPDATE qr_templates SET is_active = true, updated_at = NOW() WHERE id = $1 RETURNING *',
      [id]
    );
  }

  static validateTemplate(pattern) {
    const placeholders = ['{serial}', '{billNo}', '{barcode}', '{flavors}', '{sku}', '{quantity}', '{price}'];
    const missingPlaceholders = placeholders.filter(p => !pattern.includes(p));
    
    return {
      valid: pattern.length > 0,
      missingPlaceholders,
      usedPlaceholders: placeholders.filter(p => pattern.includes(p))
    };
  }
}

export default TemplateModel;
