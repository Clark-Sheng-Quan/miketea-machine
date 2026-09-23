import { getCollection } from '../config/mongodb.js';

const collection = () => getCollection('product_code_settings');

export class ProductCodeSwitch {
  static async initializeTable() {}

  static async getSwitch(businessId) {
    const setting = await collection().findOne({ business_id: businessId });
    return setting || this.createSwitch(businessId, false);
  }

  static async createSwitch(businessId, enabled = false) {
    const now = new Date();
    await collection().updateOne(
      { business_id: businessId },
      { $set: { enabled, updated_at: now }, $setOnInsert: { created_at: now } },
      { upsert: true }
    );
    return collection().findOne({ business_id: businessId });
  }

  static async updateSwitch(businessId, enabled) {
    return this.createSwitch(businessId, enabled);
  }
}
