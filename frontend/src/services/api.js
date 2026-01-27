import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Auth service for POS login and options
export const posAuthAPI = {
  login: (email, password) => client.post('/service/pos/login', { email, password }),
  getOptions: (token, businessId) => client.get('/service/pos/options', { params: { token, business_id: businessId } }),
  searchProducts: (token, businessId, query = '', pageSize = 10, pageIdx = 0) => client.post('/service/pos/search-products', { query, page_size: pageSize, page_idx: pageIdx }, { params: { token, business_id: businessId } })
};

// Item codes service for database operations
export const itemCodesAPI = {
  save: (businessId, itemCodes) => client.post('/service/pos/item-codes/save', { 
    business_id: businessId, 
    item_codes: itemCodes 
  }),
  getAll: (businessId) => client.get(`/service/pos/item-codes/${businessId}`),
  getByOption: (businessId, optionId) => client.get(`/service/pos/item-codes/${businessId}/option/${optionId}`)
};

// QR Protocol service for formula management
export const qrProtocolAPI = {
  getFormula: (businessId) => client.get('/service/pos/qr-protocol/formula', { params: { business_id: businessId } }),
  saveFormula: (businessId, formula) => client.post('/service/pos/qr-protocol/formula', { 
    business_id: businessId, 
    formula 
  })
};

// Product codes service for database operations
export const productCodesAPI = {
  getAll: (businessId) => client.get('/service/pos/product-codes', { params: { business_id: businessId } }),
  save: (businessId, productId, code) => client.post('/service/pos/product-codes', { 
    business_id: businessId, 
    product_id: productId,
    code
  }),
  delete: (businessId, productId) => client.delete(`/service/pos/product-codes/${productId}`, { params: { business_id: businessId } })
};

export default client;
