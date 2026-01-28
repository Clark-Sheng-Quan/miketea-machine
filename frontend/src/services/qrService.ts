/**
 * QR Service
 * Handles QR formula loading and QR string generation from order data
 */

import QRCode from 'qrcode'

const BUSINESS_ID = '67295c445242136caa4511d4'

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

interface ProductCodeResponse {
  success: boolean
  data?: Array<{
    product_id: string
    code: string
  }>
}

interface OptionCodeResponse {
  success: boolean
  data?: Array<{
    option_item_id: string
    code: string
  }>
}

interface FormulaResponse {
  success: boolean
  data?: {
    formula: string
  }
}

interface SwitchResponse {
  success: boolean
  data?: {
    enabled: boolean
  }
}

/**
 * Load QR formula from database
 * @returns {Promise<string>} QR formula string
 */
export const loadQRFormula = async (): Promise<string> => {
  try {
    const response = await fetch(
      `/api/service/pos/qr-protocol/formula?business_id=${BUSINESS_ID}`
    )
    const result: FormulaResponse = await response.json()

    if (result.success && result.data?.formula) {
      return result.data.formula
    }

    // Return default formula if not found
    return '#{productCode}|#{optionCodes}'
  } catch (error) {
    console.error('Failed to load QR formula:', error)
    // Return default formula on error
    return '#{productCode}|#{optionCodes}'
  }
}

/**
 * Check if product code feature is enabled
 * @returns {Promise<boolean>} True if enabled, false otherwise
 */
const isProductCodeEnabled = async (): Promise<boolean> => {
  try {
    const response = await fetch(
      `/api/service/pos/product-code-switch?business_id=${BUSINESS_ID}`
    )
    const result: SwitchResponse = await response.json()
    if (result.success && result.data) {
      return result.data.enabled === true
    }
  } catch (error) {
    console.error('Failed to check product code switch:', error)
  }
  return false // Default to disabled
}

/**
 * Get product code from database
 * @param {string} productId - Product ID
 * @returns {Promise<string>} Product code or product ID as fallback
 */
const getProductCode = async (productId: string): Promise<string> => {
  try {
    const response = await fetch(
      `/api/service/pos/product-codes?business_id=${BUSINESS_ID}`
    )
    const result: ProductCodeResponse = await response.json()
    if (result.success && result.data && Array.isArray(result.data)) {
      const productCode = result.data.find(item => item.product_id === productId)
      if (productCode) {
        return productCode.code
      }
    }
  } catch (error) {
    console.error('Failed to get product code:', error)
  }
  return productId // Fallback to product ID
}

/**
 * Get option item code from database
 * @param {string} optionId - Option ID
 * @param {string} optionItemId - Option item ID
 * @returns {Promise<string>} Option code or option item ID as fallback
 */
const getOptionItemCode = async (optionId: string, optionItemId: string): Promise<string> => {
  try {
    const response = await fetch(
      `/api/service/pos/item-codes/${BUSINESS_ID}/option/${optionId}`
    )
    const result: OptionCodeResponse = await response.json()
    if (result.success && result.data && Array.isArray(result.data)) {
      const itemCode = result.data.find(item => item.option_item_id === optionItemId)
      if (itemCode) {
        return itemCode.code
      }
    }
  } catch (error) {
    console.error('Failed to get option item code:', error)
  }
  return optionItemId // Fallback to option item ID
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
