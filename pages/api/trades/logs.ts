import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // MVP: Hardcoded user ID for testing
  const userId = 1;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { tradeId, limit = '100' } = req.query;

    let sql = `
      SELECT tl.*, t.symbol, t.side 
      FROM trade_logs tl
      JOIN trades t ON tl.trade_id = t.id
      WHERE t.user_id = $1
    `;
    const params: any[] = [userId];

    if (tradeId) {
      sql += ' AND tl.trade_id = $2';
      params.push(tradeId);
    }

    sql += ' ORDER BY tl.timestamp DESC LIMIT $' + (params.length + 1);
    params.push(parseInt(limit as string));

    const result = await query(sql, params);

    return res.status(200).json({ logs: result.rows });
  } catch (error) {
    console.error('Error fetching trade logs:', error);
    return res.status(500).json({ error: 'Failed to fetch trade logs' });
  }
}
