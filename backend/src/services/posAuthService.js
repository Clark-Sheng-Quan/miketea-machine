import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const POS_API_BASE = process.env.POS_API_BASE;
let posAuthToken = null;
let tokenExpireTime = null;

export class PosAuthService {
  /**
   * Login to POS system and get authentication token
   */
  static async login() {
    try {
      console.log('[PosAuth] Attempting to login to POS system...');

      const response = await axios.post(
        `${POS_API_BASE}/admin/terminal_login`,
        {
          email: POS_ACCOUNT,
          password: POS_PASSWORD
        },
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      // Store token and expiration
      posAuthToken = response.data.token || response.data.access_token;
      // Assume token expires in 24 hours if not specified
      tokenExpireTime = Date.now() + (24 * 60 * 60 * 1000);

      console.log('[PosAuth] Login successful. Token obtained.');
      return posAuthToken;
    } catch (error) {
      console.error('[PosAuth] Login failed:', error.response?.data || error.message);
      throw new Error(`POS Login Failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get valid token, refresh if expired
   */
  static async getValidToken() {
    // Check if token is about to expire (within 5 minutes)
    if (!posAuthToken || (tokenExpireTime && Date.now() > tokenExpireTime - 5 * 60 * 1000)) {
      console.log('[PosAuth] Token expired or missing, re-authenticating...');
      await this.login();
    }
    return posAuthToken;
  }

  /**
   * Create authenticated axios client
   */
  static async getAuthenticatedClient() {
    const token = await this.getValidToken();

    return axios.create({
      baseURL: POS_API_BASE,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
  }

  /**
   * Make authenticated API call
   */
  static async makeRequest(method, endpoint, data = null) {
    try {
      const client = await this.getAuthenticatedClient();

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
          throw new Error(`Unsupported HTTP method: ${method}`);
      }

      return response.data;
    } catch (error) {
      console.error(`[PosAuth] API call failed: ${method} ${endpoint}`, error.message);
      throw error;
    }
  }

  /**
   * Get current token (for debugging)
   */
  static getCurrentToken() {
    return posAuthToken;
  }

  /**
   * Clear token (for logout)
   */
  static clearToken() {
    posAuthToken = null;
    tokenExpireTime = null;
    console.log('[PosAuth] Token cleared');
  }
}

export default PosAuthService;
