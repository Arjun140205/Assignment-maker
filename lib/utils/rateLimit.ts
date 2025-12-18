/**
 * In-memory Rate Limiting Utility
 * Implements a sliding window rate limiter for API routes
 */

interface RateLimitConfig {
    windowMs: number;      // Time window in milliseconds
    maxRequests: number;   // Maximum requests per window
    keyPrefix?: string;    // Optional prefix for keys
}

interface RateLimitEntry {
    count: number;
    resetTime: number;
    firstRequestTime: number;
}

interface RateLimitResult {
    success: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;   // Seconds until rate limit resets (only if limited)
}

/**
 * In-memory rate limiter using sliding window algorithm
 * Note: This is suitable for single-server deployments.
 * For distributed systems, use Redis-based rate limiting.
 */
class RateLimiter {
    private store: Map<string, RateLimitEntry> = new Map();
    private cleanupInterval: NodeJS.Timeout | null = null;
    private readonly CLEANUP_INTERVAL_MS = 60000; // Clean up every minute

    constructor() {
        // Start periodic cleanup of expired entries
        this.startCleanup();
    }

    /**
     * Check if a request should be rate limited
     */
    check(key: string, config: RateLimitConfig): RateLimitResult {
        const now = Date.now();
        const fullKey = config.keyPrefix ? `${config.keyPrefix}:${key}` : key;

        const entry = this.store.get(fullKey);

        // No existing entry - allow and create new entry
        if (!entry) {
            this.store.set(fullKey, {
                count: 1,
                resetTime: now + config.windowMs,
                firstRequestTime: now,
            });

            return {
                success: true,
                remaining: config.maxRequests - 1,
                resetTime: now + config.windowMs,
            };
        }

        // Check if window has expired
        if (now > entry.resetTime) {
            // Reset the window
            this.store.set(fullKey, {
                count: 1,
                resetTime: now + config.windowMs,
                firstRequestTime: now,
            });

            return {
                success: true,
                remaining: config.maxRequests - 1,
                resetTime: now + config.windowMs,
            };
        }

        // Window still active - check count
        if (entry.count >= config.maxRequests) {
            const retryAfterSeconds = Math.ceil((entry.resetTime - now) / 1000);

            return {
                success: false,
                remaining: 0,
                resetTime: entry.resetTime,
                retryAfter: retryAfterSeconds,
            };
        }

        // Increment counter
        entry.count += 1;
        this.store.set(fullKey, entry);

        return {
            success: true,
            remaining: config.maxRequests - entry.count,
            resetTime: entry.resetTime,
        };
    }

    /**
     * Reset rate limit for a specific key
     */
    reset(key: string, keyPrefix?: string): void {
        const fullKey = keyPrefix ? `${keyPrefix}:${key}` : key;
        this.store.delete(fullKey);
    }

    /**
     * Get current rate limit status for a key
     */
    getStatus(key: string, config: RateLimitConfig): { count: number; remaining: number; resetTime: number } | null {
        const fullKey = config.keyPrefix ? `${config.keyPrefix}:${key}` : key;
        const entry = this.store.get(fullKey);

        if (!entry || Date.now() > entry.resetTime) {
            return null;
        }

        return {
            count: entry.count,
            remaining: config.maxRequests - entry.count,
            resetTime: entry.resetTime,
        };
    }

    /**
     * Start periodic cleanup of expired entries
     */
    private startCleanup(): void {
        if (typeof window !== 'undefined') {
            // Don't run cleanup in browser
            return;
        }

        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, this.CLEANUP_INTERVAL_MS);

        // Prevent the interval from keeping Node.js alive
        if (this.cleanupInterval.unref) {
            this.cleanupInterval.unref();
        }
    }

    /**
     * Clean up expired entries
     */
    private cleanup(): void {
        const now = Date.now();

        for (const [key, entry] of this.store.entries()) {
            if (now > entry.resetTime) {
                this.store.delete(key);
            }
        }
    }

    /**
     * Stop the cleanup interval (for testing/cleanup)
     */
    stopCleanup(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }

    /**
     * Get current store size (for monitoring)
     */
    getStoreSize(): number {
        return this.store.size;
    }
}

// Singleton instance
const rateLimiter = new RateLimiter();

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMIT_CONFIGS = {
    // AI generation endpoint - more restrictive
    generate: {
        windowMs: 60 * 1000,    // 1 minute window
        maxRequests: 10,        // 10 requests per minute
        keyPrefix: 'gen',
    } as RateLimitConfig,

    // File upload endpoint - slightly more permissive
    upload: {
        windowMs: 60 * 1000,    // 1 minute window
        maxRequests: 20,        // 20 requests per minute
        keyPrefix: 'upl',
    } as RateLimitConfig,

    // General API endpoint
    api: {
        windowMs: 60 * 1000,    // 1 minute window
        maxRequests: 100,       // 100 requests per minute
        keyPrefix: 'api',
    } as RateLimitConfig,
} as const;

/**
 * Extract client IP from request headers
 * Works with various proxy configurations
 */
export function getClientIp(request: Request): string {
    // Try various headers in order of preference
    const headers = request.headers;

    // Cloudflare
    const cfConnectingIp = headers.get('cf-connecting-ip');
    if (cfConnectingIp) return cfConnectingIp;

    // X-Forwarded-For (most common)
    const xForwardedFor = headers.get('x-forwarded-for');
    if (xForwardedFor) {
        // Take the first IP (client IP)
        return xForwardedFor.split(',')[0].trim();
    }

    // X-Real-IP (nginx)
    const xRealIp = headers.get('x-real-ip');
    if (xRealIp) return xRealIp;

    // Fallback - use a combination of headers as pseudo-identity
    const userAgent = headers.get('user-agent') || 'unknown';
    return `unknown-${hashString(userAgent)}`;
}

/**
 * Simple hash function for fallback IP generation
 */
function hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16).substring(0, 8);
}

/**
 * Create rate limit headers for response
 */
export function createRateLimitHeaders(result: RateLimitResult, config: RateLimitConfig): Headers {
    const headers = new Headers();

    headers.set('X-RateLimit-Limit', config.maxRequests.toString());
    headers.set('X-RateLimit-Remaining', result.remaining.toString());
    headers.set('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString());

    if (!result.success && result.retryAfter) {
        headers.set('Retry-After', result.retryAfter.toString());
    }

    return headers;
}

/**
 * Create a rate-limited JSON response (429 Too Many Requests)
 */
export function createRateLimitedResponse(result: RateLimitResult, config: RateLimitConfig): Response {
    const headers = createRateLimitHeaders(result, config);
    headers.set('Content-Type', 'application/json');

    return new Response(
        JSON.stringify({
            error: 'Too Many Requests',
            message: `Rate limit exceeded. Please try again in ${result.retryAfter} seconds.`,
            retryAfter: result.retryAfter,
        }),
        {
            status: 429,
            headers,
        }
    );
}

/**
 * Middleware-style rate limiter for use in API routes
 * Returns null if request is allowed, or a Response if rate limited
 */
export function checkRateLimit(
    request: Request,
    configKey: keyof typeof RATE_LIMIT_CONFIGS
): { allowed: true; remaining: number } | { allowed: false; response: Response } {
    const config = RATE_LIMIT_CONFIGS[configKey];
    const clientIp = getClientIp(request);
    const result = rateLimiter.check(clientIp, config);

    if (!result.success) {
        return {
            allowed: false,
            response: createRateLimitedResponse(result, config),
        };
    }

    return {
        allowed: true,
        remaining: result.remaining,
    };
}

/**
 * Add rate limit headers to an existing response
 */
export function addRateLimitHeadersToResponse(
    response: Response,
    request: Request,
    configKey: keyof typeof RATE_LIMIT_CONFIGS
): Response {
    const config = RATE_LIMIT_CONFIGS[configKey];
    const clientIp = getClientIp(request);
    const status = rateLimiter.getStatus(clientIp, config);

    if (!status) {
        return response;
    }

    const newHeaders = new Headers(response.headers);
    newHeaders.set('X-RateLimit-Limit', config.maxRequests.toString());
    newHeaders.set('X-RateLimit-Remaining', status.remaining.toString());
    newHeaders.set('X-RateLimit-Reset', Math.ceil(status.resetTime / 1000).toString());

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
    });
}

// Export for testing
export { rateLimiter };
export type { RateLimitConfig, RateLimitResult };
