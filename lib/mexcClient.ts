import axios, { AxiosInstance } from "axios";
import crypto from "crypto";
import { Candle, OrderBookSnapshot } from "./types";

const BASE_URL = process.env.MEXC_BASE_URL ?? "https://contract.mexc.com/api";
const DEFAULT_SYMBOL = process.env.MEXC_SYMBOL ?? "SOL_USDT";

type Credentials = {
  apiKey: string;
  apiSecret: string;
};

export class MexcClient {
  private readonly http: AxiosInstance;
  constructor(private readonly credentials?: Credentials) {
    this.http = axios.create({
      baseURL: BASE_URL,
      timeout: 10_000,
    });
  }

  private sign(params: Record<string, string | number>) {
    if (!this.credentials) {
      throw new Error("API credentials not configured");
    }
    const sorted = Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join("&");
    const signature = crypto
      .createHmac("sha256", this.credentials.apiSecret)
      .update(sorted)
      .digest("hex");
    return {
      signature,
      query: sorted,
    };
  }

  private async signedRequest<T>(
    method: "GET" | "POST",
    path: string,
    params: Record<string, string | number> = {},
  ) {
    const base = {
      req_time: Date.now(),
      ...params,
    };
    const { signature, query } = this.sign(base);
    const headers = {
      "X-API-KEY": this.credentials!.apiKey,
    };
    const url = `${path}?${query}&sign=${signature}`;
    if (method === "GET") {
      const res = await this.http.get<T>(url, { headers });
      return res.data;
    }
    const res = await this.http.post<T>(url, params, { headers });
    return res.data;
  }

  async fetchTicker(symbol = DEFAULT_SYMBOL) {
    const response = await this.http.get<{ data: { fairPrice: string }[] }>(`/v1/contract/ticker?symbol=${symbol}`);
    const payload = response.data?.data ?? [];
    return Number(payload[0]?.fairPrice ?? 0);
  }

  async fetchOrderBook(symbol = DEFAULT_SYMBOL): Promise<OrderBookSnapshot> {
    const response = await this.http.get<{ data: { bids: [string, string][]; asks: [string, string][] } }>(
      `/v1/contract/depth?symbol=${symbol}&limit=40`,
    );
    const orderbook = response.data?.data ?? { bids: [], asks: [] };
    const bidNotional = (orderbook.bids ?? []).reduce<number>(
      (acc: number, [price, qty]: [string, string]) => acc + Number(price) * Number(qty),
      0,
    );
    const askNotional = (orderbook.asks ?? []).reduce<number>(
      (acc: number, [price, qty]: [string, string]) => acc + Number(price) * Number(qty),
      0,
    );
    return { bidNotional, askNotional };
  }

  async fetchRecentCandles(symbol = DEFAULT_SYMBOL, interval = "Min1", limit = 120): Promise<Candle[]> {
    const response = await this.http.get<{ data: [number, string, string, string, string, string][] }>(
      `/v1/contract/kline?symbol=${symbol}&interval=${interval}&limit=${limit}`,
    );
    return (response.data?.data ?? []).map((row: [number, string, string, string, string, string]) => ({
      timestamp: row[0],
      open: Number(row[1]),
      high: Number(row[2]),
      low: Number(row[3]),
      close: Number(row[4]),
      volume: Number(row[5]),
    }));
  }

  async placeMarketOrder(params: {
    symbol?: string;
    side: "BUY" | "SELL";
    leverage: number;
    quantity: number;
    stopLoss?: number;
    takeProfit?: number;
  }) {
    const payload = {
      client_order_id: `aimexcbot-${Date.now()}`,
      symbol: params.symbol ?? DEFAULT_SYMBOL,
      price: 0,
      vol: params.quantity,
      leverage: params.leverage,
      side: params.side === "BUY" ? 1 : 2,
      type: 1, // market order
    };
    return this.signedRequest("POST", "/v1/private/order/submit", payload);
  }

  async fetchOpenPositions(symbol = DEFAULT_SYMBOL) {
    return this.signedRequest("GET", "/v1/private/position/list", { symbol });
  }

  async cancelAll(symbol = DEFAULT_SYMBOL) {
    return this.signedRequest("POST", "/v1/private/order/cancelAll", { symbol });
  }
}

export const publicClient = new MexcClient();
