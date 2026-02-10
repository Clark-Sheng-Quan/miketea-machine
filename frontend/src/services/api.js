import axios from 'axios';

const API_BASE_URL = 'http://54.90.180.79:3000';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to inject token only for specific APIs
client.interceptors.request.use((config) => {
  // Only add token to these APIs
  const tokenRequiredAPIs = [
    '/tea_machine/search_options',
    '/tea_machine/search_products',
  ];
  
  const isTokenRequired = tokenRequiredAPIs.some(api => config.url && config.url.includes(api));
  
  if (isTokenRequired) {
    const token = localStorage.getItem('posToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Auth service for POS login and options
export const posAuthAPI = {
  login: (email, password) => client.post('/tea_machine/login', { email, password }),
  getOptions: (businessId, pageSize, pageIdx) => client.get('/tea_machine/search_options', { 
    params: { business_id: businessId, page_size: pageSize, page_idx: pageIdx }
  }),
  searchProducts: (businessId, pageSize, pageIdx) => client.get('/tea_machine/search_products', { 
    params: { business_id: businessId, page_size: pageSize, page_idx: pageIdx }
  })
};

// Item codes service for database operations
export const itemCodesAPI = {
  save: (businessId, itemCodes) => client.post('/tea_machine/save_optionCode', { 
    business_id: businessId, 
    item_codes: itemCodes 
  }),
  getAll: (businessId) => client.get('/tea_machine/get_optionCode', { 
    params: { business_id: businessId }
  }),
  getByOption: (businessId, optionId) => client.get('/tea_machine/search_optionCode', { 
    params: { business_id: businessId, option_id: optionId }
  })
};

// QR Protocol service for formula management
export const qrProtocolAPI = {
  getFormula: (businessId) => client.get('/tea_machine/get_formula', { params: { business_id: businessId } }),
  saveFormula: (businessId, formula) => client.post('/tea_machine/save_formula', { 
    business_id: businessId, 
    formula 
  })
};

// Product codes service for database operations
export const productCodesAPI = {
  searchByProduct: (businessId, productId) => client.get('/tea_machine/search_productCode', { 
    params: { business_id: businessId, product_id: productId } 
  }),
  save: (businessId, productId, code) => client.post('/tea_machine/save_productCode', { 
    business_id: businessId, 
    product_id: productId,
    code
  }),
  getSwitch: (businessId) => client.get('/tea_machine/getSwitch', { params: { business_id: businessId } }),
  setSwitch: (businessId, enabled) => client.post('/tea_machine/saveSwitch', { 
    business_id: businessId, 
    enabled
  })
};

export default client;
