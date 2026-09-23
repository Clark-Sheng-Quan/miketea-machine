import { getCollection } from '../config/mongodb.js';

const collection = () => getCollection('option_item_codes');

export class OptionItemCode {
  static async initializeTable() {}

  static async saveItemCodes(businessId, itemCodes) {
    const now = new Date();
    if (itemCodes.length > 0) {
      await collection().bulkWrite(itemCodes.map(item => ({
        updateOne: {
          filter: { business_id: businessId, option_item_id: item.optionItemId },
          update: {
            $set: { option_id: item.optionId, code: item.code, updated_at: now },
            $setOnInsert: { created_at: now }
          },
          upsert: true
        }
      })));
    }

    return collection().find({
      business_id: businessId,
      option_item_id: { $in: itemCodes.map(item => item.optionItemId) }
    }).toArray();
  }

  static async getAllOptionCodes(businessId) {
    return collection().find({ business_id: businessId }).sort({ option_id: 1, option_item_id: 1 }).toArray();
  }

  static async getItemCodesByOptionId(businessId, optionId) {
    return collection().find({ business_id: businessId, option_id: optionId }).sort({ option_item_id: 1 }).toArray();
  }

  static async getItemCode(businessId, optionItemId) {
    return collection().findOne({ business_id: businessId, option_item_id: optionItemId });
  }

  static async deleteItemCode(businessId, optionItemId) {
    await collection().deleteOne({ business_id: businessId, option_item_id: optionItemId });
  }
}
