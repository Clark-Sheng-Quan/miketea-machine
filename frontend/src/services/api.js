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
  getOptions: (token, businessId) => client.get('/service/pos/options', { params: { token, business_id: businessId } })
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

export default client;
