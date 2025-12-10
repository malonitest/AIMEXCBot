import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = 1; // Mock user ID

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get total trades
    const totalTradesResult = await query(
      'SELECT COUNT(*) as total FROM trades WHERE user_id = $1',
      [userId]
    );
    const totalTrades = parseInt(totalTradesResult.rows[0].total);

    // Get active trades
    const activeTradesResult = await query(
      'SELECT COUNT(*) as active FROM trades WHERE user_id = $1 AND status = $2',
      [userId, 'OPEN']
    );
    const activeTrades = parseInt(activeTradesResult.rows[0].active);

    // Get total PnL
    const pnlResult = await query(
      'SELECT SUM(pnl) as total_pnl FROM trades WHERE user_id = $1 AND status = $2',
      [userId, 'CLOSED']
    );
    const totalPnL = parseFloat(pnlResult.rows[0].total_pnl) || 0;

    // Get win rate
    const winRateResult = await query(
      `SELECT 
        COUNT(*) FILTER (WHERE pnl > 0) as wins,
        COUNT(*) as total
       FROM trades 
       WHERE user_id = $1 AND status = $2`,
      [userId, 'CLOSED']
    );
    const wins = parseInt(winRateResult.rows[0].wins) || 0;
    const totalClosed = parseInt(winRateResult.rows[0].total) || 0;
    const winRate = totalClosed > 0 ? (wins / totalClosed) * 100 : 0;

    // Get active strategies
    const activeStrategiesResult = await query(
      'SELECT COUNT(*) as active FROM strategies WHERE user_id = $1 AND is_active = true',
      [userId]
    );
    const activeStrategies = parseInt(activeStrategiesResult.rows[0].active);

    return res.status(200).json({
      totalTrades,
      activeTrades,
      totalPnL,
      winRate,
      activeStrategies,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
}
