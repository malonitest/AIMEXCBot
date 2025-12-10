import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';
import { decrypt } from '../../../lib/encryption';
import { TradingEngine } from '../../../lib/strategy/engine';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // MVP: Hardcoded user ID for testing
  const userId = 1;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user's API keys
    const keysResult = await query(
      'SELECT * FROM api_keys WHERE user_id = $1 AND is_active = true',
      [userId]
    );

    if (keysResult.rows.length === 0) {
      return res.status(400).json({ error: 'No API keys configured' });
    }

    const apiKeyData = keysResult.rows[0];
    const apiKey = decrypt(apiKeyData.encrypted_api_key);
    const secretKey = decrypt(apiKeyData.encrypted_secret_key);

    // Get active strategies
    const strategiesResult = await query(
      'SELECT * FROM strategies WHERE user_id = $1 AND is_active = true',
      [userId]
    );

    if (strategiesResult.rows.length === 0) {
      return res.status(400).json({ error: 'No active strategies found' });
    }

    const engine = new TradingEngine(apiKey, secretKey, userId);
    const results = [];

    // Execute each strategy
    for (const strategy of strategiesResult.rows) {
      try {
        await engine.executeStrategy(strategy);
        results.push({ strategyId: strategy.id, success: true });
      } catch (error: any) {
        results.push({ strategyId: strategy.id, success: false, error: error.message });
      }
    }

    return res.status(200).json({ results });
  } catch (error: any) {
    console.error('Error executing strategies:', error);
    return res.status(500).json({ error: 'Failed to execute strategies', message: error.message });
  }
}
