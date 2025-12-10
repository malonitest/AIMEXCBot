// User and API Keys
export interface User {
  id: number;
  username: string;
  created_at: Date;
}

export interface ApiKey {
  id: number;
  user_id: number;
  encrypted_api_key: string;
  encrypted_secret_key: string;
  created_at: Date;
  is_active: boolean;
}

// Trading Strategy
export interface Strategy {
  id: number;
  user_id: number;
  name: string;
  symbol: string;
  leverage: number;
  position_size_usdt: number;
  stop_loss_percent: number;
  take_profit_percent: number;
  strategy_type: 'trend_following' | 'mean_reversion' | 'breakout';
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// Trade
export interface Trade {
  id: number;
  user_id: number;
  strategy_id: number;
  symbol: string;
  side: 'LONG' | 'SHORT';
  entry_price: number;
  exit_price?: number;
  quantity: number;
  leverage: number;
  pnl?: number;
  pnl_percent?: number;
  status: 'OPEN' | 'CLOSED' | 'CANCELLED';
  opened_at: Date;
  closed_at?: Date;
}

// Trade Log
export interface TradeLog {
  id: number;
  trade_id: number;
  log_type: 'INFO' | 'WARNING' | 'ERROR' | 'ENTRY' | 'EXIT';
  message: string;
  timestamp: Date;
}

// MEXC API Types
export interface MEXCOrderRequest {
  symbol: string;
  side: 1 | 2; // 1 = open long, 2 = open short, 3 = close long, 4 = close short
  type: 1 | 2 | 3 | 4 | 5 | 6; // 1 = limit, 2 = market, 3 = system take-profit, etc.
  vol: number;
  leverage: number;
  openType?: 1 | 2; // 1 = isolated, 2 = cross
  price?: number;
}

export interface MEXCOrderResponse {
  success: boolean;
  code: number;
  data?: {
    orderId: string;
  };
  message?: string;
}

export interface MEXCPositionResponse {
  success: boolean;
  code: number;
  data?: Array<{
    symbol: string;
    positionType: number;
    openAvgPrice: number;
    holdVol: number;
    leverage: number;
    unrealisedPnl: number;
  }>;
}

// Dashboard Data
export interface DashboardStats {
  totalTrades: number;
  activeTrades: number;
  totalPnL: number;
  winRate: number;
  activeStrategies: number;
}

// Settings
export interface UserSettings {
  apiKey: string;
  secretKey: string;
  defaultLeverage: number;
  riskPercent: number;
}
