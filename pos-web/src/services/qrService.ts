/**
 * QR Service
 * Handles QR formula loading and QR string generation from order data
 */

import QRCode from 'qrcode'

const BUSINESS_ID = '67295c445242136caa4511d4'
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNjVmN2JiOTE5NmVhMjA3MjJkOWQxMWI5IiwiZW1haWwiOiJsb3VoYW93ZWlAZ21haWwuY29tIiwicGhvbmUiOiIwNDAwMDAwMDAxIiwiZXhwIjoxNzY5MTQ2MzMxfQ.yAb8KemT9h7sjJZAlYg03fntKLkAdSQ65MUsNAotD0I'

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
 * Get data from local storage
 */
const getFromStorage = (key: string): any => {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error(`Failed to get data from storage key ${key}:`, error)
    return null
  }
}

/**
 * Save data to local storage
 */
const saveToStorage = (key: string, data: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error(`Failed to save data to storage key ${key}:`, error)
  }
}

/**
 * Sync all data from API to local storage (single unified API call)
 * @returns {Promise<boolean>} True if sync successful
 */
export const syncQRDataFromAPI = async (): Promise<boolean> => {
  try {
    console.log('[QR Service] Starting data sync from API...')
    
    // Single unified sync API call
    const response = await fetch(
      `/api/tea_machine/sync-qr-data?business_id=${BUSINESS_ID}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    )
    const result = await response.json()
    
    if (!result.success) {
      console.error('[QR Service] Sync API returned error:', result.message)
      return false
    }

    const data = result.data

    // Save all data to local storage
    if (data.formula) {
      saveToStorage(STORAGE_KEYS.FORMULA, data.formula)
      console.log('[QR Service] Formula synced')
    }

    if (data.switch !== undefined) {
      saveToStorage(STORAGE_KEYS.SWITCH, data.switch)
      console.log('[QR Service] Product code switch synced')
    }

    if (data.productCodes && Array.isArray(data.productCodes)) {
      saveToStorage(STORAGE_KEYS.PRODUCT_CODES, data.productCodes)
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
        saveToStorage(cacheKey, codes)
      }
      console.log(`[QR Service] ${data.optionCodes.length} option codes synced`)
    }

    // Update last sync time
    saveToStorage(STORAGE_KEYS.LAST_SYNC, new Date().toISOString())
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
export const getLastSyncTime = (): string | null => {
  return getFromStorage(STORAGE_KEYS.LAST_SYNC)
}

/**
 * Clear all cached data
 */
export const clearQRDataCache = (): void => {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key)
  })
  console.log('[QR Service] Cache cleared')
}

export const loadQRFormula = async (): Promise<string> => {
  // Load from local storage only
  const cached = getFromStorage(STORAGE_KEYS.FORMULA)
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
  // Load from local storage only
  const cached = getFromStorage(STORAGE_KEYS.SWITCH)
  if (cached !== null) {
    console.log('[QR Service] Loading product code switch from cache')
    return cached === true
  }

  // Default to disabled if not in cache
  console.log('[QR Service] No product code switch in cache, defaulting to disabled')
  return false
}

/**
 * Get product code from local storage
 * @param {string} productId - Product ID
 * @returns {Promise<string>} Product code or product ID as fallback
 */
const getProductCode = async (productId: string): Promise<string> => {
  // Load from local storage only
  const cached = getFromStorage(STORAGE_KEYS.PRODUCT_CODES)
  if (cached && Array.isArray(cached)) {
    console.log('[QR Service] Loading product codes from cache')
    const productCode = cached.find(item => item.product_id === productId)
    if (productCode) {
      return productCode.code
    }
  }

  // Fallback to product ID if not in cache
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
  // Load from local storage only
  const cacheKey = `${STORAGE_KEYS.OPTION_CODES}_${optionId}`
  let cached = getFromStorage(cacheKey)
  
  if (cached && Array.isArray(cached)) {
    console.log(`[QR Service] Loading option codes for ${optionId} from cache`)
    const itemCode = cached.find(item => item.option_item_id === optionItemId)
    if (itemCode) {
      return itemCode.code
    }
  }

  // Fallback to option item ID if not in cache
  console.log(`[QR Service] Option code for ${optionItemId} not in cache, using option item ID`)
  return optionItemId
}

/**
 * Convert order data to QR string list
 * Each product generates one QR string with all its option codes combined
 * @param {Order} order - Order data with products and options
 * @param {string} formula - QR formula template (#{productCode}|#{optionCodes})
 * @returns {Promise<QRResult[]>} Array of QR string objects {productName, qrString}
 */
export const generateQRStringsFromOrder = async (order: Order, formula: string): Promise<QRResult[]> => {
  const qrList: QRResult[] = []

  // Check if product code feature is enabled
  const productCodeEnabled = await isProductCodeEnabled()
  console.log('[QR Service] Product code enabled:', productCodeEnabled)

  // Process each product
  for (const product of order.products) {
    const productId = product._id
    
    // Determine what to use as product code
    let productCode: string
    if (productCodeEnabled) {
      // Load from database if enabled
      productCode = await getProductCode(productId)
    } else {
      // Use product ID directly if disabled
      productCode = productId
    }
    console.log('[QR Service] ProductId:', productId, '-> Code:', productCode)

    // Collect all option codes for this product
    const optionCodes: string[] = []

    for (const optionGroup of product.options || []) {
      // Filter to only include items with qty >= 1
      for (const item of optionGroup.option_items?.filter(i => i.qty >= 1) || []) {
        // Get option code from database
        const optionCode = await getOptionItemCode(optionGroup._id, item._id)
        optionCodes.push(optionCode)
      }
    }

    // Only generate QR string if there are option codes
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
 * Get valid option groups (only those with items where qty >= 1)
 * @param {Product} product - Product with options
 * @returns {OptionGroup[]} Filtered option groups with valid items
 */
export const getValidOptionGroups = (product: Product): OptionGroup[] => {
  return product.options?.filter(optGroup =>
    optGroup.option_items?.some(item => item.qty >= 1)
  ) || []
}

/**
 * Count valid option items in a product
 * @param {Product} product - Product with options
 * @returns {number} Count of items with qty >= 1
 */
export const countValidOptionItems = (product: Product): number => {
  return (
    product.options?.reduce(
      (sum, opt) => sum + (opt.option_items?.filter(item => item.qty >= 1).length || 0),
      0
    ) || 0
  )
}

/**
 * Generate QR code as Data URL
 * @param {string} qrString - The string to encode in QR code
 * @param {Object} options - QR code options
 * @returns {Promise<string>} Data URL of the QR code image
 */
export const generateQRCodeDataURL = async (
  qrString: string,
  options?: {
    width?: number
    margin?: number
    color?: {
      dark?: string
      light?: string
    }
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
  }
): Promise<string> => {
  try {
    const defaultOptions = {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H' as const,
      ...options
    }

    const dataURL = await QRCode.toDataURL(qrString, defaultOptions)
    return dataURL
  } catch (error) {
    console.error('Failed to generate QR code:', error)
    throw new Error(`Failed to generate QR code: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Generate QR code and return canvas element
 * @param {HTMLCanvasElement} canvas - Canvas element to draw QR code on
 * @param {string} qrString - The string to encode in QR code
 * @param {Object} options - QR code options
 * @returns {Promise<void>}
 */
export const generateQRCodeToCanvas = async (
  canvas: HTMLCanvasElement,
  qrString: string,
  options?: {
    width?: number
    margin?: number
    color?: {
      dark?: string
      light?: string
    }
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
  }
): Promise<void> => {
  try {
    const defaultOptions = {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H' as const,
      ...options
    }

    await QRCode.toCanvas(canvas, qrString, defaultOptions)
  } catch (error) {
    console.error('Failed to generate QR code to canvas:', error)
    throw new Error(`Failed to generate QR code to canvas: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Batch generate QR codes for multiple strings
 * @param {string[]} qrStrings - Array of strings to encode
 * @param {Object} options - QR code options
 * @returns {Promise<string[]>} Array of Data URLs
 */
export const generateQRCodesBatch = async (
  qrStrings: string[],
  options?: {
    width?: number
    margin?: number
    color?: {
      dark?: string
      light?: string
    }
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
  }
): Promise<string[]> => {
  try {
    const dataURLs = await Promise.all(
      qrStrings.map(qrString => generateQRCodeDataURL(qrString, options))
    )
    return dataURLs
  } catch (error) {
    console.error('Failed to batch generate QR codes:', error)
    throw new Error(`Failed to batch generate QR codes: ${error instanceof Error ? error.message : String(error)}`)
  }
}
