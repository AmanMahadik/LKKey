// A simple sliding-window in-memory rate limiter for server environments

const rateLimitMap = new Map<string, number[]>();

/**
 * Checks if a key has exceeded the allowed rate limit.
 * @param keyId The unique identifier of the key (e.g., api key id or IP address)
 * @param limit The maximum number of requests allowed in 1 minute (defaults to 100)
 * @returns true if the request is allowed, false if rate limited
 */
export function checkRateLimit(keyId: string, limit: number = 100): boolean {
  const now = Date.now();
  const oneMinuteAgo = now - 60 * 1000;

  // Retrieve timestamps for this key
  let timestamps = rateLimitMap.get(keyId) || [];

  // Filter out timestamps older than 1 minute
  timestamps = timestamps.filter(t => t > oneMinuteAgo);

  if (timestamps.length >= limit) {
    rateLimitMap.set(keyId, timestamps); // Update with pruned timestamps
    return false;
  }

  // Record this request
  timestamps.push(now);
  rateLimitMap.set(keyId, timestamps);
  return true;
}
