import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export interface GeneratedKeyInfo {
  rawKey: string;     // What we display to the user once: lk_key_[id]_[secret]
  keyId: string;      // What we query in DB: lk_key_[id]
  keyHash: string;    // What we store in DB (bcrypt hash of rawKey)
}

export function generateApiKey(): GeneratedKeyInfo {
  const prefix = 'lk_key';
  const keyIdPart = crypto.randomBytes(6).toString('hex'); // 12 characters
  const secretPart = crypto.randomBytes(16).toString('hex'); // 32 characters
  
  const keyId = `${prefix}_${keyIdPart}`;
  const rawKey = `${keyId}_${secretPart}`;
  
  const salt = bcrypt.genSaltSync(10);
  const keyHash = bcrypt.hashSync(rawKey, salt);
  
  return {
    rawKey,
    keyId,
    keyHash
  };
}
