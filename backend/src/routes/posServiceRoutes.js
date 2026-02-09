import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import { OptionItemCode } from '../models/OptionItemCode.js';
import { Template } from '../models/Template.js';
import { ProductCode } from '../models/ProductCode.js';
import { ProductCodeSwitch } from '../models/ProductCodeSwitch.js';
import { normalizeFormulaParameters, validateFormulaParameters } from '../utils/naming.js';
import { verifyTokenMiddleware } from '../services/tokenService.js';

dotenv.config();

const router = express.Router();
const POS_API_BASE = process.env.POS_API_BASE;


/**
 * GET /api/service/pos/options
 * Get all options (flavors) from POS system with pagination
 * Query: { token, business_id, page_size, page_idx }
 */
router.get('/search_options', async (req, res) => {
  try {
    // Get token from query params (frontend passes in URL)
    const { token, business_id, page_size = '50', page_idx = '0' } = req.query;
    const pageSize = parseInt(page_size);
    const pageIdx = parseInt(page_idx);

    if (!business_id) {
      return res.status(400).json({
        success: false,
        message: 'Business ID is required'
      });
    }

    console.log('[PosService] Fetching options for business:', business_id, 'page_idx:', pageIdx, 'page_size:', pageSize);

    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Add token to POS API request if provided
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const client = axios.create({
      baseURL: POS_API_BASE,
      headers: headers,
      timeout: 10000
    });

    // Call /search/option_search with business_id
    const response = await client.post('/search/option_search', {
      query: {
        business_id: business_id
      },
      detail: true
    });

    console.log('[PosService] Options fetched successfully');

    // Filter response to only include option_id, name, and option_items with item_id and name
    const allOptions = (response.data?.option || []).map(option => ({
      _id: option._id,
      name: option.name,
      option_items: (option.option_items || []).map(item => ({
        _id: item._id,
        name: item.name
      }))
    }));

    // Apply pagination
    const startIdx = pageIdx * pageSize;
    const endIdx = startIdx + pageSize;
    const paginatedOptions = allOptions.slice(startIdx, endIdx);
    const maxPage = Math.ceil(allOptions.length / pageSize);

    const filteredData = {
      option: paginatedOptions,
      max_page: maxPage,
      total: allOptions.length
    };

    res.json({
      success: true,
      data: filteredData
    });
  } catch (error) {
    console.error('[PosService] Fetch options error:', error.message);

    // Check if it's a business_id not found error
    if (error.response?.status === 404 || error.response?.data?.message?.includes('not found')) {
      return res.status(400).json({
        success: false,
        message: `Business ID not found in POS system: ${error.response?.data?.message || 'Invalid business ID'}`
      });
    }

    // Check if it's an authentication error
    if (error.response?.status === 401) {
      return res.status(401).json({
        success: false,
        message: 'POS API authentication failed - Invalid token'
      });
    }

    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.message || 'Failed to fetch options from POS system',
      error: error.message
    });
  }
});;

/**
 * GET /api/service/pos/search-products
 * Search products from POS system
 * Query: { token, business_id, page_size, page_idx }
 */
router.get('/search_products', async (req, res) => {
  try {
    // Get token from query params (frontend passes in URL)
    const { token, business_id, page_size = '20', page_idx = '0' } = req.query;
    const pageSize = parseInt(page_size);
    const pageIdx = parseInt(page_idx);

    if (!business_id) {
      return res.status(400).json({
        success: false,
        message: 'Business ID is required'
      });
    }

    console.log('[PosService] Searching products for business:', business_id, 'page_idx:', pageIdx, 'page_size:', pageSize);

    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Add token to POS API request if provided
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const client = axios.create({
      baseURL: POS_API_BASE,
      headers: headers,
      timeout: 10000
    });

    // Call /search/product_search with business_id and pagination
    const response = await client.post('/search/product_search', {
      query: {
        business_id: business_id
      },
      page_size: pageSize,
      page_idx: pageIdx,
      detail: true
    });

    // Check if response has data
    if (!response.data || !response.data.data || !response.data.data.products) {
      return res.json({
        success: true,
        data: {
          products: [],
          max_page: 0,
          total: 0
        }
      });
    }

    console.log('[PosService] Products searched successfully');

    // Filter response to only include product_id and name
    const filteredData = {
      ...response.data,
      data: {
        ...response.data.data,
        products: (response.data.data?.products || []).map(product => ({
          product_id: product.product_id,
          name: product.name
        }))
      }
    };

    res.json({
      success: true,
      data: filteredData
    });
  } catch (error) {
    console.error('[PosService] Search products error:', error.message);

    // Check if it's a business_id not found error
    if (error.response?.status === 404 || error.response?.data?.message?.includes('not found')) {
      return res.status(400).json({
        success: false,
        message: `Business ID not found in POS system: ${error.response?.data?.message || 'Invalid business ID'}`
      });
    }

    // Check if it's an authentication error
    if (error.response?.status === 401) {
      return res.status(401).json({
        success: false,
        message: 'POS API authentication failed - Invalid token'
      });
    }

    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.message || 'Failed to search products from POS system',
      error: error.message
    });
  }
});


/**
 * POST /api/tea_machine/save_optionCode
 * Save option item codes to database
 * Body: { business_id, item_codes: [{ optionId, optionItemId, code }, ...] }
 */
router.post('/save_optionCode', async (req, res) => {
  try {
    const { business_id, item_codes } = req.body;

    if (!business_id) {
      return res.status(400).json({
        success: false,
        message: 'business_id is required'
      });
    }

    if (!Array.isArray(item_codes) || item_codes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'item_codes array is required'
      });
    }

    console.log(`[PosService] Saving ${item_codes.length} item codes for business ${business_id}`);

    const result = await OptionItemCode.saveItemCodes(business_id, item_codes);

    console.log(`[PosService] Successfully saved ${result.length} item codes for business ${business_id}`);

    res.json({
      success: true,
      message: `Saved ${result.length} item codes`,
      data: result
    });
  } catch (error) {
    console.error('[PosService] Save item codes error:', error.message);
    console.error('[PosService] Full error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to save item codes',
      error: error.message
    });
  }
});

/**
 * GET /api/tea_machine/get_optionCode
 * Get all item codes for a business
 * Query: { business_id }
 */
router.get('/get_optionCode', async (req, res) => {
  try {
    const { business_id } = req.query;

    if (!business_id) {
      return res.status(400).json({
        success: false,
        message: 'business_id is required'
      });
    }

    console.log(`[PosService] Fetching item codes for business ${business_id}`);

    const codes = await OptionItemCode.getAllOptionCodes(business_id);

    res.json({
      success: true,
      data: codes
    });
  } catch (error) {
    console.error('[PosService] Get item codes error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Failed to get item codes',
      error: error.message
    });
  }
});

/**
 * GET /api/tea_machine/search_optionCode
 * Get item codes for a specific option
 * Query: { business_id, option_id }
 */
router.get('/search_optionCode', async (req, res) => {
  try {
    const { business_id, option_id } = req.query;

    if (!business_id || !option_id) {
      return res.status(400).json({
        success: false,
        message: 'business_id and option_id are required'
      });
    }

    console.log(`[PosService] Fetching item codes for option ${option_id} in business ${business_id}`);

    const codes = await OptionItemCode.getItemCodesByOptionId(business_id, option_id);

    res.json({
      success: true,
      data: codes
    });
  } catch (error) {
    console.error('[PosService] Get item codes by option error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Failed to get item codes',
      error: error.message
    });
  }
});

/**
 * GET /api/tea_machine/get_formula
 * Get current QR protocol formula for business
 * Query: { business_id }
 */
router.get('/get_formula', async (req, res) => {
  try {
    const { business_id } = req.query;

    if (!business_id) {
      return res.status(400).json({
        success: false,
        message: 'Business ID is required'
      });
    }

    console.log('[QRProtocol] Fetching formula for business:', business_id);

    // Get active template or latest template
    const template = await Template.getActive(business_id);
    
    if (!template) {
      // If no active template, get the most recent one
      const templates = await Template.getAllFormulas(business_id);
      if (templates.length === 0) {
        return res.json({
          success: true,
          data: {
            formula: 'ORD|#{productCode}|#{optionCodes}',
            message: 'No saved formula, using default'
          }
        });
      }
      
      const latestTemplate = templates[templates.length - 1];
      const parsedJson = typeof latestTemplate.template_json === 'string' 
        ? JSON.parse(latestTemplate.template_json) 
        : latestTemplate.template_json;
      
      return res.json({
        success: true,
        data: {
          formula: parsedJson.formula,
          templateId: latestTemplate.id
        }
      });
    }

    const parsedJson = typeof template.template_json === 'string' 
      ? JSON.parse(template.template_json) 
      : template.template_json;

    res.json({
      success: true,
      data: {
        formula: parsedJson.formula,
        templateId: template.id
      }
    });
  } catch (error) {
    console.error('[QRProtocol] Get formula error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Failed to get formula',
      error: error.message
    });
  }
});

/**
 * POST /api/tea_machine/save_formula
 * Save QR protocol formula for business
 * Body: { business_id, formula }
 */
router.post('/save_formula', async (req, res) => {
  try {
    const { business_id, formula } = req.body;

    if (!business_id) {
      return res.status(400).json({
        success: false,
        message: 'Business ID is required'
      });
    }

    if (!formula || formula.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Formula is required'
      });
    }

    // 规范化参数名为驼峰格式
    const normalizedFormula = normalizeFormulaParameters(formula);
    
    // 验证参数是否有效
    const validation = validateFormulaParameters(normalizedFormula);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: `Invalid parameters: ${validation.invalidParams.join(', ')}`
      });
    }



    // Check if there's an existing template
    const existingTemplates = await Template.getAllFormulas(business_id);
    
    let result;
    if (existingTemplates.length > 0) {
      // Update the first template (active one)
      const existingTemplate = existingTemplates[0];
      result = await Template.updateFormula(
        existingTemplate.id,
        'Current in Use',
        { formula: normalizedFormula },
        true
      );
    } else {
      // Create new template
      result = await Template.createFormula(
        business_id,
        'Current in Use',
        { formula: normalizedFormula }
      );
    }

    console.log('[QRProtocol] Formula saved successfully');

    res.json({
      success: true,
      message: 'Formula saved successfully',
      data: {
        templateId: result.id,
        formula: normalizedFormula
      }
    });
  } catch (error) {
    console.error('[QRProtocol] Save formula error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Failed to save formula',
      error: error.message
    });
  }
});

/**
 * GET /api/tea_machine/get_productCode
 * Get all product codes for a business
 * Query: { business_id }
 * Returns: { success, data: [...] }
 */
router.get('/get_productCode', async (req, res) => {
  try {
    const { business_id } = req.query;

    if (!business_id) {
      return res.status(400).json({
        success: false,
        message: 'business_id is required'
      });
    }

    console.log(`[ProductCode] Getting codes for business: ${business_id}`);

    const codes = await ProductCode.getAllProductCodes(business_id);

    res.json({
      success: true,
      data: codes
    });
  } catch (error) {
    console.error('[ProductCode] Get error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Failed to get product codes',
      error: error.message
    });
  }
});

/**
 * POST /api/tea_machine/save_productCode
 * Save or update product code
 * Body: { business_id, product_id, code }
 * Returns: { success, data: {...} }
 */
router.post('/save_productCode', async (req, res) => {
  try {
    const { business_id, product_id, code } = req.body;

    if (!business_id || !product_id || !code) {
      return res.status(400).json({
        success: false,
        message: 'business_id, product_id, and code are required'
      });
    }

    console.log(`[ProductCode] Saving code for product: ${product_id}, business: ${business_id}`);

    const result = await ProductCode.saveProductCode(business_id, product_id, code);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('[ProductCode] Save error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Failed to save product code',
      error: error.message
    });
  }
});

/**
 * GET /api/tea_machine/search_productCode
 * Get product code for a specific product
 * Query: { business_id, product_id }
 * Returns: { success, data: [{product_id, code}] }
 */
router.get('/search_productCode', async (req, res) => {
  try {
    const { business_id, product_id } = req.query;

    if (!business_id || !product_id) {
      return res.status(400).json({
        success: false,
        message: 'business_id and product_id are required'
      });
    }

    console.log(`[ProductCode] Fetching code for product ${product_id} in business ${business_id}`);

    const codes = await ProductCode.getProductCodesByProductId(business_id, product_id);

    res.json({
      success: true,
      data: codes
    });
  } catch (error) {
    console.error('[ProductCode] Get product code error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Failed to get product code',
      error: error.message
    });
  }
});

/**
 * GET /api/tea_machine/getSwitch
 * Get product code switch status for a business
 * Query: { business_id }
 * Returns: { success, data: { business_id, enabled } }
 */
router.get('/getSwitch', async (req, res) => {
  try {
    const { business_id } = req.query;

    if (!business_id) {
      return res.status(400).json({
        success: false,
        message: 'business_id is required'
      });
    }

    console.log(`[ProductCodeSwitch] Getting switch status for business: ${business_id}`);

    const setting = await ProductCodeSwitch.getSwitch(business_id);

    res.json({
      success: true,
      data: setting
    });
  } catch (error) {
    console.error('[ProductCodeSwitch] Get error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Failed to get product code switch status',
      error: error.message
    });
  }
});

/**
 * GET /api/service/pos/sync-qr-data
 * Sync all QR-related data from database to frontend
 * Requires valid POS token for authentication
 * Returns all data needed for QR code generation in one response
 * Header: Authorization: Bearer <token>
 * Query: { business_id }
 * Returns: { success, data: { formula, switch, productCodes, optionCodes } }
 */
router.get('/sync-qr-data', verifyTokenMiddleware(), async (req, res) => {
  try {
    const { business_id } = req.query;

    if (!business_id) {
      return res.status(400).json({
        success: false,
        message: 'business_id is required'
      });
    }

    console.log(`[SyncQRData] Syncing all QR data for business: ${business_id}`);

    // Fetch all data in parallel
    const [formula, switchStatus, productCodes, optionCodes] = await Promise.all([
      // Get QR formula
      Template.getActive(business_id).catch(err => {
        console.error('[SyncQRData] Error fetching formula:', err.message);
        return null;
      }),
      // Get product code switch status
      ProductCodeSwitch.getSwitch(business_id).catch(err => {
        console.error('[SyncQRData] Error fetching switch:', err.message);
        return { enabled: false };
      }),
      // Get all product codes for this business
      ProductCode.getAllProductCodes(business_id).catch(err => {
        console.error('[SyncQRData] Error fetching product codes:', err.message);
        return [];
      }),
      // Get all option item codes
      OptionItemCode.getAllOptionCodes(business_id).catch(err => {
        console.error('[SyncQRData] Error fetching option codes:', err.message);
        return [];
      })
    ]);

    // Parse template_json if it's a string
    let formulaStr = '#{productCode}|#{optionCodes}';
    if (formula && formula.template_json) {
      const parsed = typeof formula.template_json === 'string' 
        ? JSON.parse(formula.template_json) 
        : formula.template_json;
      formulaStr = parsed.formula || formulaStr;
    }

    res.json({
      success: true,
      data: {
        formula: formulaStr,
        switch: switchStatus?.enabled || false,
        productCodes: productCodes || [],
        optionCodes: optionCodes || []
      }
    });
  } catch (error) {
    console.error('[SyncQRData] Sync error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Failed to sync QR data',
      error: error.message
    });
  }
});

/**
 * POST /api/tea_machine/saveSwitch
 * Update product code switch status
 * Body: { business_id, enabled }
 * Returns: { success, data: { business_id, enabled } }
 */
router.post('/saveSwitch', async (req, res) => {
  try {
    const { business_id, enabled } = req.body;

    if (!business_id || typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'business_id and enabled (boolean) are required'
      });
    }

    console.log(`[ProductCodeSwitch] Setting switch for business: ${business_id}, enabled: ${enabled}`);

    const result = await ProductCodeSwitch.updateSwitch(business_id, enabled);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('[ProductCodeSwitch] Update error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Failed to update product code switch',
      error: error.message
    });
  }
});

export default router;
