import { getCollection } from '../config/mongodb.js';

const collection = () => getCollection('qr_templates');

export class Template {
  static async initializeTable() {}

  static async getAllFormulas(businessId) {
    return collection().find({ business_id: businessId }).sort({ name: 1 }).toArray();
  }

  static async getActive(businessId) {
    return collection().findOne({ business_id: businessId, is_active: true });
  }

  static async createFormula(businessId, name, templateJson) {
    const now = new Date();
    const template = {
      id: `template_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      business_id: businessId,
      name,
      template_json: templateJson,
      is_active: false,
      created_at: now,
      updated_at: now
    };
    await collection().insertOne(template);
    return template;
  }

  static async updateFormula(id, name, templateJson, isActive) {
    await collection().updateOne(
      { id },
      { $set: { name, template_json: templateJson, is_active: isActive, updated_at: new Date() } }
    );
    return collection().findOne({ id });
  }

  static async delete(id) {
    await collection().deleteOne({ id });
  }
}
