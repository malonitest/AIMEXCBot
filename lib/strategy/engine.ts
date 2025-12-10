import { MEXCClient } from '../mexc/client';
import { Strategy, Trade } from '../../types';
import { query } from '../db';

export class TradingEngine {
  private mexcClient: MEXCClient;
  private userId: number;

  constructor(apiKey: string, secretKey: string, userId: number) {
    this.mexcClient = new MEXCClient(apiKey, secretKey);
    this.userId = userId;
  }

  // Trend Following Strategy
  private async trendFollowingSignal(symbol: string): Promise<'LONG' | 'SHORT' | null> {
    try {
      const ticker = await this.mexcClient.getTicker(symbol);
      
      // Simple trend following based on price momentum
      // In production, you would use more sophisticated indicators
      const lastPrice = ticker.data?.lastPrice || 0;
      const volume = ticker.data?.volume24 || 0;

      // Mock signal generation - replace with real technical analysis
      const random = Math.random();
      if (random > 0.6 && volume > 1000000) {
        return 'LONG';
      } else if (random < 0.4 && volume > 1000000) {
        return 'SHORT';
      }
      return null;
    } catch (error) {
      console.error('Error generating trend following signal:', error);
      return null;
    }
  }

  // Execute strategy
  async executeStrategy(strategy: Strategy): Promise<void> {
    try {
      console.log(`Executing strategy: ${strategy.name} for symbol ${strategy.symbol}`);

      // Check if there are already open positions for this strategy
      const openTrades = await query(
        'SELECT * FROM trades WHERE user_id = $1 AND strategy_id = $2 AND status = $3',
        [this.userId, strategy.id, 'OPEN']
      );

      if (openTrades.rows.length > 0) {
        console.log('Strategy already has open positions, monitoring...');
        await this.monitorOpenPositions(strategy, openTrades.rows);
        return;
      }

      // Generate trading signal
      let signal: 'LONG' | 'SHORT' | null = null;
      
      switch (strategy.strategy_type) {
        case 'trend_following':
          signal = await this.trendFollowingSignal(strategy.symbol);
          break;
        case 'mean_reversion':
        case 'breakout':
          // Implement other strategies
          signal = null;
          break;
      }

      if (!signal) {
        console.log('No signal generated, waiting...');
        return;
      }

      // Get current price
      const ticker = await this.mexcClient.getTicker(strategy.symbol);
      const currentPrice = ticker.data?.lastPrice || 0;

      if (!currentPrice) {
        throw new Error('Could not fetch current price');
      }

      // Calculate position size
      const positionSizeInCoin = strategy.position_size_usdt / currentPrice;

      // Place order
      const side = signal === 'LONG' ? 1 : 2; // 1=open long, 2=open short
      const orderResponse = await this.mexcClient.placeOrder({
        symbol: strategy.symbol,
        side,
        type: 2, // market order
        vol: positionSizeInCoin,
        leverage: strategy.leverage,
        openType: 1, // isolated margin
      });

      if (orderResponse.success) {
        // Record trade in database
        const tradeResult = await query(
          `INSERT INTO trades (user_id, strategy_id, symbol, side, entry_price, quantity, leverage, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
          [
            this.userId,
            strategy.id,
            strategy.symbol,
            signal,
            currentPrice,
            positionSizeInCoin,
            strategy.leverage,
            'OPEN'
          ]
        );

        const trade = tradeResult.rows[0];

        // Log trade entry
        await query(
          `INSERT INTO trade_logs (trade_id, log_type, message)
           VALUES ($1, $2, $3)`,
          [
            trade.id,
            'ENTRY',
            `Opened ${signal} position at ${currentPrice} with ${strategy.leverage}x leverage`
          ]
        );

        console.log(`Trade opened: ${signal} ${strategy.symbol} at ${currentPrice}`);
      }
    } catch (error) {
      console.error('Error executing strategy:', error);
      throw error;
    }
  }

  // Monitor open positions for stop loss and take profit
  private async monitorOpenPositions(strategy: Strategy, openTrades: any[]): Promise<void> {
    try {
      const ticker = await this.mexcClient.getTicker(strategy.symbol);
      const currentPrice = ticker.data?.lastPrice || 0;

      for (const trade of openTrades) {
        const entryPrice = parseFloat(trade.entry_price);
        const priceChange = ((currentPrice - entryPrice) / entryPrice) * 100;
        
        // Adjust for short positions
        const effectiveChange = trade.side === 'SHORT' ? -priceChange : priceChange;

        let shouldClose = false;
        let reason = '';

        // Check stop loss
        if (effectiveChange <= -strategy.stop_loss_percent) {
          shouldClose = true;
          reason = `Stop loss triggered at ${currentPrice}`;
        }

        // Check take profit
        if (effectiveChange >= strategy.take_profit_percent) {
          shouldClose = true;
          reason = `Take profit triggered at ${currentPrice}`;
        }

        if (shouldClose) {
          await this.closeTrade(trade, currentPrice, reason);
        }
      }
    } catch (error) {
      console.error('Error monitoring positions:', error);
    }
  }

  // Close trade
  private async closeTrade(trade: any, exitPrice: number, reason: string): Promise<void> {
    try {
      const side = trade.side === 'LONG' ? 3 : 4; // 3=close long, 4=close short
      
      await this.mexcClient.closePosition(
        trade.symbol,
        side,
        parseFloat(trade.quantity)
      );

      // Calculate PnL
      const entryPrice = parseFloat(trade.entry_price);
      const quantity = parseFloat(trade.quantity);
      const leverage = parseInt(trade.leverage);

      let pnl: number;
      if (trade.side === 'LONG') {
        pnl = (exitPrice - entryPrice) * quantity * leverage;
      } else {
        pnl = (entryPrice - exitPrice) * quantity * leverage;
      }

      const pnlPercent = (pnl / (entryPrice * quantity)) * 100;

      // Update trade in database
      await query(
        `UPDATE trades SET exit_price = $1, pnl = $2, pnl_percent = $3, status = $4, closed_at = NOW()
         WHERE id = $5`,
        [exitPrice, pnl, pnlPercent, 'CLOSED', trade.id]
      );

      // Log trade closure
      await query(
        `INSERT INTO trade_logs (trade_id, log_type, message)
         VALUES ($1, $2, $3)`,
        [trade.id, 'EXIT', reason]
      );

      console.log(`Trade closed: ${trade.side} ${trade.symbol} - PnL: ${pnl.toFixed(2)} USDT (${pnlPercent.toFixed(2)}%)`);
    } catch (error) {
      console.error('Error closing trade:', error);
      throw error;
    }
  }
}
