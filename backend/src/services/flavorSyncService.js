import { FlavorModel } from '../models/Flavor.js';
import { PosAuthService } from './posAuthService.js';
import dotenv from 'dotenv';

dotenv.config();

export class FlavorSyncService {
  static async syncFlavorsFromProductSystem() {
    try {
      console.log('[FlavorSync] Starting flavor synchronization from Product System...');
      
      // Fetch products from Product System
      const products = await this.fetchProductsFromProductSystem();
      
      // Extract and deduplicate flavors
      const flavors = this.extractFlavorsFromProducts(products);
      
      // Sync to local database
      const result = await FlavorModel.syncFlavorsFromProductSystem(flavors);
      
      console.log(`[FlavorSync] Successfully synced ${result.synced} flavors`);
      return result;
    } catch (error) {
      console.error('[FlavorSync] Error during synchronization:', error.message);
      throw error;
    }
  }

  static async fetchProductsFromProductSystem() {
    try {
      console.log('[FlavorSync] Fetching products from POS system...');

      // Use authenticated POS API client
      const response = await PosAuthService.makeRequest('GET', '/api/products');

      console.log('[FlavorSync] Successfully fetched products from POS system');
      return response.data || response || [];
    } catch (error) {
      console.error('[FlavorSync] Failed to fetch products:', error.message);
      throw new Error(`POS API Error: ${error.message}`);
    }
  }

  static extractFlavorsFromProducts(products) {
    const flavorMap = new Map();

    for (const product of products) {
      if (product.options && Array.isArray(product.options)) {
        for (const option of product.options) {
          const groupKey = option.name || 'default';
          
          if (!flavorMap.has(groupKey)) {
            flavorMap.set(groupKey, []);
          }

          if (option.items && Array.isArray(option.items)) {
            for (const item of option.items) {
              const flavorKey = `${groupKey}-${item.name}`;
              
              // Avoid duplicates
              if (!flavorMap.get(groupKey).some(f => f.name === item.name)) {
                flavorMap.get(groupKey).push({
                  flavor_name: item.name,
                  group_name: groupKey,
                  product_system_id: item.id || null
                });
              }
            }
          }
        }
      }
    }

    // Flatten the map into array
    const flavors = [];
    for (const [groupName, items] of flavorMap) {
      flavors.push(...items);
    }

    return flavors;
  }

  static generateFlavorCodes(flavors) {
    const codeMap = {};
    let counter = {};

    for (const flavor of flavors) {
      const groupPrefix = this.getGroupPrefix(flavor.group_name);
      
      if (!counter[groupPrefix]) {
        counter[groupPrefix] = 1;
      } else {
        counter[groupPrefix]++;
      }

      const code = `${groupPrefix}${String(counter[groupPrefix]).padStart(3, '0')}`;
      flavor.flavor_code = code;
      codeMap[flavor.flavor_name] = code;
    }

    return { flavors, codeMap };
  }

  static getGroupPrefix(groupName) {
    const prefixes = {
      'ice': 'I',
      'sugar': 'S',
      'temperature': 'T',
      'toppings': 'O'
    };

    for (const [key, prefix] of Object.entries(prefixes)) {
      if (groupName.toLowerCase().includes(key)) {
        return prefix;
      }
    }

    return 'F'; // Default: Flavor
  }
}

export default FlavorSyncService;
