const MAX_RETRIES = 3;
const RETRY_DELAYS = [5_000, 30_000, 120_000]; // 5s, 30s, 2min

export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxAttempts = MAX_RETRIES,
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(url, options);

      // Don't retry on client errors (4xx)
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response;
      }

      // Retry on server errors (5xx) and rate limits (429)
      if (attempt < maxAttempts - 1) {
        const delay = RETRY_DELAYS[attempt] ?? RETRY_DELAYS[RETRY_DELAYS.length - 1];
        console.warn(
          `[webhook-retry] ${url} returned ${response.status}, retrying in ${delay}ms (attempt ${attempt + 1}/${maxAttempts})`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxAttempts - 1) {
        const delay = RETRY_DELAYS[attempt] ?? RETRY_DELAYS[RETRY_DELAYS.length - 1];
        console.warn(`[webhook-retry] ${url} failed: ${lastError.message}, retrying in ${delay}ms`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError ?? new Error(`Webhook failed after ${maxAttempts} attempts`);
}
