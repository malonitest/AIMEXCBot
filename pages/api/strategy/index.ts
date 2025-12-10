import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // MVP: Hardcoded user ID for testing
  // TODO: Implement proper authentication before production
  const userId = 1;

  if (req.method === 'GET') {
    try {
      const result = await query(
        'SELECT * FROM strategies WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );

      return res.status(200).json({ strategies: result.rows });
    } catch (error) {
      console.error('Error fetching strategies:', error);
      return res.status(500).json({ error: 'Failed to fetch strategies' });
    }
  }

  if (req.method === 'POST') {
    try {
      const {
        name,
        symbol = 'SOL_USDT',
        leverage = 50,
        positionSize,
        stopLoss,
        takeProfit,
        strategyType = 'trend_following',
      } = req.body;

      if (!name || !positionSize || !stopLoss || !takeProfit) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const result = await query(
        `INSERT INTO strategies (user_id, name, symbol, leverage, position_size_usdt, 
         stop_loss_percent, take_profit_percent, strategy_type)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [userId, name, symbol, leverage, positionSize, stopLoss, takeProfit, strategyType]
      );

      return res.status(201).json({ strategy: result.rows[0] });
    } catch (error) {
      console.error('Error creating strategy:', error);
      return res.status(500).json({ error: 'Failed to create strategy' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
