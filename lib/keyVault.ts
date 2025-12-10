import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

let secretClient: SecretClient | null = null;
let cachedEncryptionKey: Buffer | null = null;
const inMemorySecrets: Record<string, string> = {};

function vaultUri() {
  return process.env.KEY_VAULT_URI;
}

function getClient() {
  const uri = vaultUri();
  if (!uri) {
    return null;
  }
  if (!secretClient) {
    secretClient = new SecretClient(uri, new DefaultAzureCredential());
  }
  return secretClient;
}

function normalizeKey(raw: string) {
  const normalized = raw.trim();
  if (normalized.length === 64) {
    return Buffer.from(normalized, "hex");
  }
  return Buffer.from(normalized, "base64");
}

async function getEncryptionKey(): Promise<Buffer> {
  if (cachedEncryptionKey) {
    return cachedEncryptionKey;
  }
  const secretName = process.env.KV_ENCRYPTION_SECRET_NAME ?? "aimexcbot-encryption-key";
  if (!vaultUri()) {
    const fallback = process.env.LOCAL_ENCRYPTION_KEY;
    if (!fallback) {
      throw new Error("Set KEY_VAULT_URI or LOCAL_ENCRYPTION_KEY for encryption");
    }
    cachedEncryptionKey = normalizeKey(fallback).subarray(0, 32);
    return cachedEncryptionKey;
  }
  const client = getClient();
  if (!client) {
    throw new Error("Key Vault client unavailable");
  }
  const secret = await client.getSecret(secretName);
  if (!secret.value) {
    throw new Error(`Encryption secret ${secretName} is empty`);
  }
  cachedEncryptionKey = normalizeKey(secret.value).subarray(0, 32);
  return cachedEncryptionKey;
}

export async function encryptSecret(plainText: string) {
  const iv = randomBytes(12);
  const key = await getEncryptionKey();
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

export async function decryptSecret(payload: string) {
  const buffer = Buffer.from(payload, "base64");
  const iv = buffer.subarray(0, 12);
  const tag = buffer.subarray(12, 28);
  const ciphertext = buffer.subarray(28);
  const key = await getEncryptionKey();

  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString("utf8");
}

export async function setSecret(secretName: string, value: string) {
  const client = getClient();
  if (client) {
    await client.setSecret(secretName, value);
    return;
  }
  inMemorySecrets[secretName] = value;
}

export async function getSecret(secretName: string) {
  const client = getClient();
  if (client) {
    const secret = await client.getSecret(secretName);
    return secret.value ?? "";
  }
  return inMemorySecrets[secretName] ?? "";
}
