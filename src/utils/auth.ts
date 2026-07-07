import { connectToDatabase } from '@/services/db';
import { ApiKey } from '@/models/ApiKey';
import bcrypt from 'bcryptjs';

/**
 * Validates the admin secret against the environment variable.
 * Accepts the secret via the 'x-admin-secret' header or Bearer token.
 */
export function validateAdminSecret(headers: Headers): boolean {
  const adminSecret = process.env.ADMIN_SECRET || 'amanadminsecret123';
  
  const provided = headers.get('x-admin-secret') || 
                   headers.get('authorization')?.replace('Bearer ', '');
                   
  return provided === adminSecret;
}

/**
 * Validates the client API key for public endpoints.
 * Verifies key format, checks activation status, checks dataset scope permissions,
 * and increments usage statistics.
 */
export async function validateApiKey(headers: Headers, datasetSlug?: string) {
  await connectToDatabase();
  
  const rawKey = headers.get('x-api-key');
  if (!rawKey) {
    return { success: false, error: 'Missing API key', status: 401 };
  }

  // Format check: should match lk_key_[id]_[secret] (4 parts split by underscore)
  const parts = rawKey.split('_');
  if (parts.length !== 4 || parts[0] !== 'lk' || parts[1] !== 'key') {
    return { success: false, error: 'Invalid API key format', status: 403 };
  }

  const keyId = `${parts[0]}_${parts[1]}_${parts[2]}`; // e.g. lk_key_abcdef123456

  const apiKeyRecord = await ApiKey.findOne({ keyId, isActive: true });
  if (!apiKeyRecord) {
    return { success: false, error: 'Invalid or inactive API key', status: 403 };
  }

  // Verify the key hash using bcrypt
  const matched = bcrypt.compareSync(rawKey, apiKeyRecord.keyHash);
  if (!matched) {
    return { success: false, error: 'Invalid API key', status: 403 };
  }

  // If a datasetSlug is provided, verify authorization
  if (datasetSlug) {
    const allowed = apiKeyRecord.allowedDatasets.includes('*') || 
                    apiKeyRecord.allowedDatasets.includes(datasetSlug);
    if (!allowed) {
      return { success: false, error: 'Key not authorized for this dataset', status: 403 };
    }
  }

  // Update statistics in the background
  apiKeyRecord.requestCount += 1;
  apiKeyRecord.lastUsedAt = new Date();
  apiKeyRecord.save().catch(err => {
    console.error('Error saving API key requestCount:', err);
  });

  return { success: true, apiKeyRecord };
}
