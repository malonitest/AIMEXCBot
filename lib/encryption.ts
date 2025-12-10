import CryptoJS from 'crypto-js';

// WARNING: For production, ENCRYPTION_KEY environment variable MUST be set
// This fallback is only for MVP testing purposes
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-please-change-in-production';

if (!process.env.ENCRYPTION_KEY && process.env.NODE_ENV === 'production') {
  console.error('CRITICAL: ENCRYPTION_KEY environment variable is not set in production!');
}

export function encrypt(text: string): string {
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
}

export function decrypt(encryptedText: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}
