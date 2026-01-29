/**
 * QR Service for React Native
 * Handles QR formula loading and QR string generation from order data
 */

import AsyncStorage from '@react-native-async-storage/async-storage'

const BUSINESS_ID = '67295c445242136caa4511d4'

// Local storage keys
const STORAGE_KEYS = {
  FORMULA: 'qr_formula',
  SWITCH: 'product_code_switch',
  PRODUCT_CODES: 'product_codes',
  OPTION_CODES: 'option_codes',
  LAST_SYNC: 'qr_data_last_sync'
}

// Type definitions
interface OptionItem {
  _id: string
  qty: number
  [key: string]: any
}

interface OptionGroup {
  _id: string
  name: string
  option_items?: OptionItem[]
  [key: string]: any
}

interface Product {
  _id: string
  itemId?: string
  sku?: string
  name: string
  options?: OptionGroup[]
  [key: string]: any
}

interface Order {
  _id: string
  orderId?: string
  products: Product[]
  [key: string]: any
}

interface QRResult {
  key: string
  productName: string
  optionCodes: string
  qrString: string
}

/**
 * Get data from AsyncStorage
 */
const getFromStorage = async (key: string): Promise<any> => {
  try {
    const data = await AsyncStorage.getItem(key)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error(`Failed to get data from storage key ${key}:`, error)
    return null
  }
}

/**
 * Save data to AsyncStorage
 */
const saveToStorage = async (key: string, data: any): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error(`Failed to save data to storage key ${key}:`, error)
  }
}

/**
 * Sync all data from API to local storage (single unified API call)
 * @returns {Promise<boolean>} True if sync successful
 */
export const syncQRDataFromAPI = async (apiBaseUrl: string): Promise<boolean> => {
  try {
    console.log('[QR Service] Starting data sync from API...')
    
    // Single unified sync API call
    const response = await fetch(
      `${apiBaseUrl}/api/service/pos/sync-qr-data?business_id=${BUSINESS_ID}`
    )
    const result = await response.json()
    
    if (!result.success) {
      console.error('[QR Service] Sync API returned error:', result.message)
      return false
    }

    const data = result.data

    // Save all data to local storage
    if (data.formula) {
      await saveToStorage(STORAGE_KEYS.FORMULA, data.formula)
      console.log('[QR Service] Formula synced')
    }

    if (data.switch !== undefined) {
      await saveToStorage(STORAGE_KEYS.SWITCH, data.switch)
      console.log('[QR Service] Product code switch synced')
    }

    if (data.productCodes && Array.isArray(data.productCodes)) {
      await saveToStorage(STORAGE_KEYS.PRODUCT_CODES, data.productCodes)
      console.log(`[QR Service] ${data.productCodes.length} product codes synced`)
    }

    if (data.optionCodes && Array.isArray(data.optionCodes)) {
      // Group option codes by optionId for efficient lookup
      const optionCodesMap: { [key: string]: any[] } = {}
      for (const code of data.optionCodes) {
        if (!optionCodesMap[code.option_id]) {
          optionCodesMap[code.option_id] = []
        }
        optionCodesMap[code.option_id].push(code)
      }
      
      // Save each option group separately for better performance
      for (const [optionId, codes] of Object.entries(optionCodesMap)) {
        const cacheKey = `${STORAGE_KEYS.OPTION_CODES}_${optionId}`
        await saveToStorage(cacheKey, codes)
      }
      console.log(`[QR Service] ${data.optionCodes.length} option codes synced`)
    }

    // Update last sync time
    await saveToStorage(STORAGE_KEYS.LAST_SYNC, new Date().toISOString())
    console.log('[QR Service] Data sync completed successfully')
    
    return true
  } catch (error) {
    console.error('Failed to sync QR data from API:', error)
    return false
  }
}

/**
 * Get last sync time
 */
export const getLastSyncTime = async (): Promise<string | null> => {
  return await getFromStorage(STORAGE_KEYS.LAST_SYNC)
}

/**
 * Clear all cached data
 */
export const clearQRDataCache = async (): Promise<void> => {
  try {
    const keys = Object.values(STORAGE_KEYS)
    await AsyncStorage.multiRemove(keys)
    console.log('[QR Service] Cache cleared')
  } catch (error) {
    console.error('Failed to clear cache:', error)
  }
}

export const loadQRFormula = async (): Promise<string> => {
  // Load from local storage only
  const cached = await getFromStorage(STORAGE_KEYS.FORMULA)
  if (cached) {
    console.log('[QR Service] Loading formula from cache')
    return cached
  }

  // Return default formula if not in cache
  console.log('[QR Service] No formula in cache, using default')
  return '#{productCode}|#{optionCodes}'
}

/**
 * Check if product code feature is enabled
 * @returns {Promise<boolean>} True if enabled, false otherwise
 */
const isProductCodeEnabled = async (): Promise<boolean> => {
  const cached = await getFromStorage(STORAGE_KEYS.SWITCH)
  if (cached !== null) {
    console.log('[QR Service] Loading product code switch from cache')
    return cached === true
  }

  console.log('[QR Service] No product code switch in cache, defaulting to disabled')
  return false
}

/**
 * Get product code from local storage
 * @param {string} productId - Product ID
 * @returns {Promise<string>} Product code or product ID as fallback
 */
const getProductCode = async (productId: string): Promise<string> => {
  const cached = await getFromStorage(STORAGE_KEYS.PRODUCT_CODES)
  if (cached && Array.isArray(cached)) {
    console.log('[QR Service] Loading product codes from cache')
    const productCode = cached.find((item: any) => item.product_id === productId)
    if (productCode) {
      return productCode.code
    }
  }

  console.log(`[QR Service] Product code for ${productId} not in cache, using product ID`)
  return productId
}

/**
 * Get option item code from local storage
 * @param {string} optionId - Option ID
 * @param {string} optionItemId - Option item ID
 * @returns {Promise<string>} Option code or option item ID as fallback
 */
const getOptionItemCode = async (optionId: string, optionItemId: string): Promise<string> => {
  const cacheKey = `${STORAGE_KEYS.OPTION_CODES}_${optionId}`
  const cached = await getFromStorage(cacheKey)
  
  if (cached && Array.isArray(cached)) {
    console.log(`[QR Service] Loading option codes for ${optionId} from cache`)
    const itemCode = cached.find((item: any) => item.option_item_id === optionItemId)
    if (itemCode) {
      return itemCode.code
    }
  }

  console.log(`[QR Service] Option code for ${optionItemId} not in cache, using option item ID`)
  return optionItemId
}

/**
 * Convert order data to QR string list
 * Each product generates one QR string with all its option codes combined
 * @param {Order} order - Order data with products and options
 * @param {string} formula - QR formula template
 * @returns {Promise<QRResult[]>} Array of QR string objects
 */
export const generateQRStringsFromOrder = async (order: Order, formula: string): Promise<QRResult[]> => {
  const qrList: QRResult[] = []

  const productCodeEnabled = await isProductCodeEnabled()
  console.log('[QR Service] Product code enabled:', productCodeEnabled)

  for (const product of order.products) {
    const productId = product._id
    
    let productCode: string
    if (productCodeEnabled) {
      productCode = await getProductCode(productId)
    } else {
      productCode = productId
    }
    console.log('[QR Service] ProductId:', productId, '-> Code:', productCode)

    const optionCodes: string[] = []

    for (const optionGroup of product.options || []) {
      for (const item of optionGroup.option_items?.filter(i => i.qty >= 1) || []) {
        const optionCode = await getOptionItemCode(optionGroup._id, item._id)
        optionCodes.push(optionCode)
      }
    }

    if (optionCodes.length > 0) {
      let qrString = formula
        .replace(/#{(productCode|PRODUCTCODE|ProductCode)}/g, productCode)
        .replace(/#{(optionCodes|OPTIONCODES|OptionCodes)}/g, optionCodes.join(','))
        .replace(/#{(orderId|orderID|OrderId|ORDERID)}/g, order.orderId || order._id)
        .replace(/#{(itemId|itemID|ItemId|ITEMID)}/g, product.itemId || '')
        .replace(/#{(sku|SKU|Sku|SKu)}/g, product.sku || '')

      qrList.push({
        key: `${order._id}-${productId}`,
        productName: product.name,
        optionCodes: optionCodes.join(','),
        qrString: qrString
      })
    }
  }

  return qrList
}

/**
 * Get valid option groups
 */
export const getValidOptionGroups = (product: Product): OptionGroup[] => {
  return product.options?.filter(optGroup =>
    optGroup.option_items?.some(item => item.qty >= 1)
  ) || []
}

/**
 * Count valid option items in a product
 */
export const countValidOptionItems = (product: Product): number => {
  return (
    product.options?.reduce(
      (sum, opt) => sum + (opt.option_items?.filter(item => item.qty >= 1).length || 0),
      0
    ) || 0
  )
}
