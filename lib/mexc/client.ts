import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';

export class MEXCClient {
  private apiKey: string;
  private secretKey: string;
  private baseURL: string;
  private client: AxiosInstance;

  constructor(apiKey: string, secretKey: string) {
    this.apiKey = apiKey;
    this.secretKey = secretKey;
    this.baseURL = process.env.MEXC_API_URL || 'https://contract.mexc.com';
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
    });
  }

  private generateSignature(params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    return crypto
      .createHmac('sha256', this.secretKey)
      .update(sortedParams)
      .digest('hex');
  }

  private getHeaders(signature: string): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'ApiKey': this.apiKey,
      'Request-Time': Date.now().toString(),
      'Signature': signature,
    };
  }

  // Get account positions
  async getPositions(symbol?: string) {
    try {
      const timestamp = Date.now();
      const params: Record<string, any> = { timestamp };
      if (symbol) {
        params.symbol = symbol;
      }

      const signature = this.generateSignature(params);
      const response = await this.client.get('/api/v1/private/position/list/query_page', {
        params,
        headers: this.getHeaders(signature),
      });

      return response.data;
    } catch (error: any) {
      console.error('Error fetching positions:', error.response?.data || error.message);
      throw new Error(`Failed to fetch positions: ${error.response?.data?.message || error.message}`);
    }
  }

  // Place order
  async placeOrder(params: {
    symbol: string;
    side: 1 | 2 | 3 | 4; // 1=open long, 2=open short, 3=close long, 4=close short
    type: 1 | 2; // 1=limit, 2=market
    vol: number;
    leverage: number;
    openType?: 1 | 2; // 1=isolated, 2=cross
    price?: number;
  }) {
    try {
      const timestamp = Date.now();
      const orderParams = {
        ...params,
        timestamp,
      };

      const signature = this.generateSignature(orderParams);
      const response = await this.client.post(
        '/api/v1/private/order/submit',
        orderParams,
        {
          headers: this.getHeaders(signature),
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error placing order:', error.response?.data || error.message);
      throw new Error(`Failed to place order: ${error.response?.data?.message || error.message}`);
    }
  }

  // Get ticker price
  async getTicker(symbol: string) {
    try {
      const response = await this.client.get('/api/v1/contract/ticker', {
        params: { symbol },
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching ticker:', error.response?.data || error.message);
      throw new Error(`Failed to fetch ticker: ${error.response?.data?.message || error.message}`);
    }
  }

  // Get account assets
  async getAccountAssets() {
    try {
      const timestamp = Date.now();
      const params = { timestamp };
      const signature = this.generateSignature(params);

      const response = await this.client.get('/api/v1/private/account/assets', {
        params,
        headers: this.getHeaders(signature),
      });

      return response.data;
    } catch (error: any) {
      console.error('Error fetching account assets:', error.response?.data || error.message);
      throw new Error(`Failed to fetch account assets: ${error.response?.data?.message || error.message}`);
    }
  }

  // Close position
  async closePosition(symbol: string, side: 3 | 4, vol: number) {
    return this.placeOrder({
      symbol,
      side,
      type: 2, // market order
      vol,
      leverage: 1, // leverage doesn't matter when closing
    });
  }
}
