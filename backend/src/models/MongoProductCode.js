import { getCollection } from '../config/mongodb.js';

const collection = () => getCollection('product_codes');

export class ProductCode {
  static async initializeTable() {}

  static async saveProductCode(businessId, productId, code) {
    const now = new Date();
    await collection().updateOne(
      { business_id: businessId, product_id: productId },
      { $set: { code, updated_at: now }, $setOnInsert: { created_at: now } },
      { upsert: true }
    );
    return collection().findOne({ business_id: businessId, product_id: productId });
  }

  static async getAllProductCodes(businessId) {
    return collection().find({ business_id: businessId }).sort({ created_at: 1 }).toArray();
  }

  static async getProductCode(businessId, productId) {
    return collection().findOne({ business_id: businessId, product_id: productId });
  }

  static async getProductCodesByProductId(businessId, productId) {
    return collection().find({ business_id: businessId, product_id: productId }).toArray();
  }

  static async saveProductCodes(businessId, productCodes) {
    const now = new Date();
    if (productCodes.length === 0) return { success: true, count: 0 };

    await collection().bulkWrite(productCodes.map(item => ({
      updateOne: {
        filter: { business_id: businessId, product_id: item.productId },
        update: { $set: { code: item.code, updated_at: now }, $setOnInsert: { created_at: now } },
        upsert: true
      }
    })));

    return { success: true, count: productCodes.length };
  }

  static async deleteProductCode(businessId, productId) {
    await collection().deleteOne({ business_id: businessId, product_id: productId });
  }
}
