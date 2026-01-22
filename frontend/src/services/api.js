import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Auth service for POS login
export const posAuthAPI = {
  login: (email, password) => client.post('/service/pos/login', { email, password }),
  request: (token, method, endpoint, data) => client.post('/service/pos/request', {
    token,
    method,
    endpoint,
    data
  }),
  getProducts: (token) => client.post('/service/pos/products', { token }),
  getOptions: (token, businessId) => client.get('/service/pos/options', { params: { token, business_id: businessId } })
};

export const flavorAPI = {
  getAll: () => client.get('/flavors'),
  getById: (id) => client.get(`/flavors/${id}`),
  create: (data) => client.post('/flavors', data),
  update: (id, data) => client.put(`/flavors/${id}`, data),
  delete: (id) => client.delete(`/flavors/${id}`),
  sync: () => client.post('/flavors/sync/from-product-system'),
  getByGroup: (groupName) => client.get(`/flavors/group/${groupName}`)
};

export const templateAPI = {
  getAll: () => client.get('/templates'),
  getById: (id) => client.get(`/templates/${id}`),
  getActive: () => client.get('/templates/active/current'),
  create: (data) => client.post('/templates', data),
  update: (id, data) => client.put(`/templates/${id}`, data),
  delete: (id) => client.delete(`/templates/${id}`),
  activate: (id) => client.post(`/templates/${id}/activate`)
};

export const qrProtocolAPI = {
  generate: (data) => client.post('/qr-protocol/generate', data),
  generateImage: (data) => client.post('/qr-protocol/generate-image', data),
  getBySerial: (serial) => client.get(`/qr-protocol/by-serial/${serial}`),
  getByBillNo: (billNo) => client.get(`/qr-protocol/by-billno/${billNo}`),
  search: (filters) => client.get('/qr-protocol/search', { params: filters })
};

export const posAPI = {
  getFlavors: () => client.get('/pos/flavors'),
  generateQR: (data) => client.post('/pos/generate-qr', data),
  generateQRImage: (data) => client.post('/pos/generate-qr-image', data)
};

export const adminAPI = {
  getStats: () => client.get('/admin/stats'),
  getHealth: () => client.get('/admin/health')
};

export default client;
