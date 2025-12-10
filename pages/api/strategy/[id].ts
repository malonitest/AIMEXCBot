import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = 1; // Mock user ID
  const { id } = req.query;

  if (req.method === 'PUT') {
    try {
      const { isActive } = req.body;

      const result = await query(
        'UPDATE strategies SET is_active = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *',
        [isActive, id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Strategy not found' });
      }

      return res.status(200).json({ strategy: result.rows[0] });
    } catch (error) {
      console.error('Error updating strategy:', error);
      return res.status(500).json({ error: 'Failed to update strategy' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const result = await query(
        'DELETE FROM strategies WHERE id = $1 AND user_id = $2 RETURNING *',
        [id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Strategy not found' });
      }

      return res.status(200).json({ message: 'Strategy deleted successfully' });
    } catch (error) {
      console.error('Error deleting strategy:', error);
      return res.status(500).json({ error: 'Failed to delete strategy' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
