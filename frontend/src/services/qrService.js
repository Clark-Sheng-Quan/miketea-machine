/**
 * QR Service
 * Handles QR formula loading and QR string generation from order data
 */

const BUSINESS_ID = '67295c445242136caa4511d4'

/**
 * Load QR formula from database
 * @returns {Promise<string>} QR formula string
 */
export const loadQRFormula = async () => {
  try {
    const response = await fetch(
      `/api/service/pos/qr-protocol/formula?business_id=${BUSINESS_ID}`
    )
    const result = await response.json()

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
const isProductCodeEnabled = async () => {
  try {
    const response = await fetch(
      `/api/service/pos/product-code-switch?business_id=${BUSINESS_ID}`
    )
    const result = await response.json()
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
const getProductCode = async (productId) => {
  try {
    const response = await fetch(
      `/api/service/pos/product-codes?business_id=${BUSINESS_ID}`
    )
    const result = await response.json()
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
const getOptionItemCode = async (optionId, optionItemId) => {
  try {
    const response = await fetch(
      `/api/service/pos/item-codes/${BUSINESS_ID}/option/${optionId}`
    )
    const result = await response.json()
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
 * @param {Object} order - Order data with products and options
 * @param {string} formula - QR formula template (#{productCode}|#{optionCodes})
 * @returns {Promise<Array>} Array of QR string objects {productName, qrString}
 */
export const generateQRStringsFromOrder = async (order, formula) => {
  const qrList = []

  // Check if product code feature is enabled
  const productCodeEnabled = await isProductCodeEnabled()
  console.log('[QR Service] Product code enabled:', productCodeEnabled)

  // Process each product
  for (const product of order.products) {
    const productId = product._id
    
    // Determine what to use as product code
    let productCode
    if (productCodeEnabled) {
      // Load from database if enabled
      productCode = await getProductCode(productId)
    } else {
      // Use product ID directly if disabled
      productCode = productId
    }
    console.log('[QR Service] ProductId:', productId, '-> Code:', productCode)

    // Collect all option codes for this product
    const optionCodes = []

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
 * @param {Object} product - Product with options
 * @returns {Array} Filtered option groups with valid items
 */
export const getValidOptionGroups = (product) => {
  return product.options?.filter(optGroup =>
    optGroup.option_items?.some(item => item.qty >= 1)
  ) || []
}

/**
 * Count valid option items in a product
 * @param {Object} product - Product with options
 * @returns {number} Count of items with qty >= 1
 */
export const countValidOptionItems = (product) => {
  return (
    product.options?.reduce(
      (sum, opt) => sum + (opt.option_items?.filter(item => item.qty >= 1).length || 0),
      0
    ) || 0
  )
}
