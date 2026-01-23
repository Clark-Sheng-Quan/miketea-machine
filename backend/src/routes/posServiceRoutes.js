import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import { OptionItemCode } from '../models/OptionItemCode.js';

dotenv.config();

const router = express.Router();
const POS_API_BASE = process.env.POS_API_BASE || 'https://dev.vend88.com';


/**
 * POST /api/service/pos/login
 * Frontend login proxy - forwards to real POS API
 * Body: { email, password }
 * Returns: { token, ... }
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    console.log('[PosService] Login request from frontend');

    // Forward to real POS API
    const response = await axios.post(
      `${POS_API_BASE}/admin/terminal_login`,
      {
        email,
        password
      },
      {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('[PosService] Login successful, token sent to frontend');

    // Return response to frontend
    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('[PosService] Login error:', error.response?.data || error.message);

    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.message || 'Login failed',
      error: error.message
    });
  }
});

/**
 * GET /api/service/pos/options
 * Get all options (flavors) from POS system
 * Query: { token, business_id }
 */
router.get('/options', async (req, res) => {
  try {
    const { token, business_id } = req.query;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token is required'
      });
    }

    if (!business_id) {
      return res.status(400).json({
        success: false,
        message: 'Business ID is required'
      });
    }

    console.log('[PosService] Fetching options for business:', business_id);

    const client = axios.create({
      baseURL: POS_API_BASE,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
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

    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('[PosService] Fetch options error:', error.message);

    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.message || 'Failed to fetch options',
      error: error.message
    });
  }
});

/**
 * POST /api/service/pos/request
 * Generic POS API request proxy
 * Frontend sends request with token in body
 * Body: { token, method, endpoint, data }
 */
router.post('/request', async (req, res) => {
  try {
    const { token, method = 'GET', endpoint, data = null } = req.body;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token is required'
      });
    }

    if (!endpoint) {
      return res.status(400).json({
        success: false,
        message: 'Endpoint is required'
      });
    }

    console.log(`[PosService] Proxying ${method} request to ${endpoint}`);

    // Create authenticated client
    const client = axios.create({
      baseURL: POS_API_BASE,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    // Make request
    let response;
    switch (method.toUpperCase()) {
      case 'GET':
        response = await client.get(endpoint);
        break;
      case 'POST':
        response = await client.post(endpoint, data);
        break;
      case 'PUT':
        response = await client.put(endpoint, data);
        break;
      case 'DELETE':
        response = await client.delete(endpoint);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: `Unsupported method: ${method}`
        });
    }

    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('[PosService] Proxy request error:', error.message);

    // Handle token expiration
    if (error.response?.status === 401) {
      return res.status(401).json({
        success: false,
        message: 'Token expired or invalid',
        error: error.response?.data?.message
      });
    }

    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.message || 'Request failed',
      error: error.message
    });
  }
});

/**
 * POST /api/service/pos/products
 * Get products list from POS system
 * Body: { token }
 */
router.post('/products', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token is required'
      });
    }

    console.log('[PosService] Fetching products from POS');

    const client = axios.create({
      baseURL: POS_API_BASE,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    const response = await client.get('/api/products');

    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('[PosService] Fetch products error:', error.message);

    res.status(error.response?.status || 500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
});

/**
 * POST /api/service/pos/item-codes/save
 * Save option item codes to database
 * Body: { business_id, item_codes: [{ optionId, optionItemId, code }, ...] }
 */
router.post('/item-codes/save', async (req, res) => {
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
 * GET /api/service/pos/item-codes/:business_id
 * Get all item codes for a business
 */
router.get('/item-codes/:business_id', async (req, res) => {
  try {
    const { business_id } = req.params;

    if (!business_id) {
      return res.status(400).json({
        success: false,
        message: 'business_id is required'
      });
    }

    console.log(`[PosService] Fetching item codes for business ${business_id}`);

    const codes = await OptionItemCode.getItemCodesByBusinessId(business_id);

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
 * GET /api/service/pos/item-codes/:business_id/option/:option_id
 * Get item codes for a specific option
 */
router.get('/item-codes/:business_id/option/:option_id', async (req, res) => {
  try {
    const { business_id, option_id } = req.params;

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

export default router;
