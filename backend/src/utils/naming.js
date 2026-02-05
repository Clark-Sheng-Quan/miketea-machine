/**
 * Parameter naming normalization utilities
 * Standardizes parameter names to camelCase format for database storage
 */

/**
 * Convert string to camelCase
 * Example: product_code -> productCode, PRODUCTCODE -> productCode
 * @param {string} str - String to convert
 * @returns {string} - camelCase string
 */
export function toCamelCase(str) {
  if (!str) return str;
  
  return str
    .toLowerCase()
    .replace(/_([a-z])/g, (g) => g[1].toUpperCase());
}

/**
 * Normalize all parameters in formula to camelCase
 * Converts #{PRODUCTCODE} -> #{productCode}, #{product_code} -> #{productCode}
 * @param {string} formula - QR formula with parameters
 * @returns {string} - Formula with normalized parameters
 */
export function normalizeFormulaParameters(formula) {
  if (!formula) return formula;
  
  // Define parameter mapping (lowercase -> camelCase)
  const parameterMappings = {
    'productcode': 'productCode',
    'optioncodes': 'optionCodes',
    'orderid': 'orderId',
    'itemid': 'itemId',
    'sku': 'sku'
  };
  
  // Replace all #{...} parameters in formula
  return formula.replace(/#{([a-zA-Z_][a-zA-Z0-9_]*)}/g, (match, paramName) => {
    const lowerParam = paramName.toLowerCase();
    const standardParam = parameterMappings[lowerParam] || toCamelCase(paramName);
    return `#{${standardParam}}`;
  });
}

/**
 * Validate formula parameters against allowed parameter list
 * Only allows: productCode, optionCodes, orderId, itemId, sku
 * @param {string} formula - QR formula to validate
 * @returns {object} - { isValid: boolean, invalidParams: string[] }
 */
export function validateFormulaParameters(formula) {
  const allowedParameters = [
    'productCode',
    'optionCodes',
    'orderId',
    'itemId',
    'sku'
  ];
  
  const paramRegex = /#{([a-zA-Z_][a-zA-Z0-9_]*)}/g;
  let match;
  const invalidParams = [];
  
  while ((match = paramRegex.exec(formula)) !== null) {
    const paramName = match[1];
    if (!allowedParameters.includes(paramName)) {
      invalidParams.push(paramName);
    }
  }
  
  return {
    isValid: invalidParams.length === 0,
    invalidParams: [...new Set(invalidParams)]
  };
}

