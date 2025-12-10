import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';
import { encrypt, decrypt } from '../../../lib/encryption';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // MVP: Hardcoded user ID for testing
  // TODO: Implement proper authentication (NextAuth.js, JWT, etc.) before production
  const userId = 1;

  if (req.method === 'GET') {
    try {
      const result = await query(
        'SELECT * FROM api_keys WHERE user_id = $1 AND is_active = true',
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(200).json({ hasApiKey: false });
      }

      const apiKey = result.rows[0];
      return res.status(200).json({
        hasApiKey: true,
        createdAt: apiKey.created_at,
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      return res.status(500).json({ error: 'Failed to fetch settings' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { apiKey, secretKey } = req.body;

      if (!apiKey || !secretKey) {
        return res.status(400).json({ error: 'API key and secret key are required' });
      }

      const encryptedApiKey = encrypt(apiKey);
      const encryptedSecretKey = encrypt(secretKey);

      // Upsert API keys
      await query(
        `INSERT INTO api_keys (user_id, encrypted_api_key, encrypted_secret_key)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id) 
         DO UPDATE SET encrypted_api_key = $2, encrypted_secret_key = $3, is_active = true`,
        [userId, encryptedApiKey, encryptedSecretKey]
      );

      return res.status(200).json({ success: true, message: 'API keys saved successfully' });
    } catch (error) {
      console.error('Error saving settings:', error);
      return res.status(500).json({ error: 'Failed to save settings' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
