import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // MVP: Hardcoded user ID for testing
  const userId = 1;

  if (req.method === 'GET') {
    try {
      const { status, limit = '50' } = req.query;

      let sql = `
        SELECT t.*, s.name as strategy_name 
        FROM trades t
        LEFT JOIN strategies s ON t.strategy_id = s.id
        WHERE t.user_id = $1
      `;
      const params: any[] = [userId];

      if (status) {
        sql += ' AND t.status = $2';
        params.push(status);
      }

      sql += ' ORDER BY t.opened_at DESC LIMIT $' + (params.length + 1);
      params.push(parseInt(limit as string));

      const result = await query(sql, params);

      return res.status(200).json({ trades: result.rows });
    } catch (error) {
      console.error('Error fetching trades:', error);
      return res.status(500).json({ error: 'Failed to fetch trades' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
