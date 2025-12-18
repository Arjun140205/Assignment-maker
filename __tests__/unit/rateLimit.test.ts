/**
 * Rate Limiting utility unit tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    checkRateLimit,
    RATE_LIMIT_CONFIGS,
    getClientIp,
    createRateLimitHeaders,
    createRateLimitedResponse,
    rateLimiter,
} from '@/lib/utils/rateLimit';

describe('Rate Limiting', () => {
    // Reset the rate limiter store between tests
    beforeEach(() => {
        // Access private store to reset (for testing only)
        (rateLimiter as any).store.clear();
    });

    describe('getClientIp', () => {
        const createRequest = (headers: Record<string, string>): Request => {
            return new Request('http://localhost/api/test', {
                headers: new Headers(headers),
            });
        };

        it('should extract IP from CF-Connecting-IP header', () => {
            const request = createRequest({ 'cf-connecting-ip': '1.2.3.4' });
            expect(getClientIp(request)).toBe('1.2.3.4');
        });

        it('should extract IP from X-Forwarded-For header', () => {
            const request = createRequest({ 'x-forwarded-for': '5.6.7.8, 9.10.11.12' });
            expect(getClientIp(request)).toBe('5.6.7.8');
        });

        it('should extract IP from X-Real-IP header', () => {
            const request = createRequest({ 'x-real-ip': '13.14.15.16' });
            expect(getClientIp(request)).toBe('13.14.15.16');
        });

        it('should prefer CF-Connecting-IP over other headers', () => {
            const request = createRequest({
                'cf-connecting-ip': '1.1.1.1',
                'x-forwarded-for': '2.2.2.2',
                'x-real-ip': '3.3.3.3',
            });
            expect(getClientIp(request)).toBe('1.1.1.1');
        });

        it('should generate fallback IP when no headers present', () => {
            const request = createRequest({ 'user-agent': 'TestAgent/1.0' });
            const ip = getClientIp(request);
            expect(ip).toMatch(/^unknown-[a-f0-9]+$/);
        });
    });

    describe('rateLimiter.check', () => {
        const testConfig = {
            windowMs: 1000, // 1 second window
            maxRequests: 3,
            keyPrefix: 'test',
        };

        it('should allow requests within limit', () => {
            const key = 'test-client-1';

            const result1 = rateLimiter.check(key, testConfig);
            expect(result1.success).toBe(true);
            expect(result1.remaining).toBe(2);

            const result2 = rateLimiter.check(key, testConfig);
            expect(result2.success).toBe(true);
            expect(result2.remaining).toBe(1);

            const result3 = rateLimiter.check(key, testConfig);
            expect(result3.success).toBe(true);
            expect(result3.remaining).toBe(0);
        });

        it('should block requests exceeding limit', () => {
            const key = 'test-client-2';

            // Exhaust the limit
            rateLimiter.check(key, testConfig);
            rateLimiter.check(key, testConfig);
            rateLimiter.check(key, testConfig);

            // 4th request should be blocked
            const result = rateLimiter.check(key, testConfig);
            expect(result.success).toBe(false);
            expect(result.remaining).toBe(0);
            expect(result.retryAfter).toBeDefined();
            expect(result.retryAfter).toBeGreaterThan(0);
        });

        it('should reset after window expires', async () => {
            const shortConfig = {
                windowMs: 100, // 100ms window
                maxRequests: 2,
                keyPrefix: 'short',
            };
            const key = 'test-client-3';

            // Exhaust the limit
            rateLimiter.check(key, shortConfig);
            rateLimiter.check(key, shortConfig);

            const blocked = rateLimiter.check(key, shortConfig);
            expect(blocked.success).toBe(false);

            // Wait for window to expire
            await new Promise(resolve => setTimeout(resolve, 150));

            // Should be allowed again
            const result = rateLimiter.check(key, shortConfig);
            expect(result.success).toBe(true);
            expect(result.remaining).toBe(1);
        });

        it('should track different keys independently', () => {
            const key1 = 'client-a';
            const key2 = 'client-b';

            // Use up all requests for key1
            rateLimiter.check(key1, testConfig);
            rateLimiter.check(key1, testConfig);
            rateLimiter.check(key1, testConfig);
            const blockedResult = rateLimiter.check(key1, testConfig);
            expect(blockedResult.success).toBe(false);

            // key2 should still have its full quota
            const result = rateLimiter.check(key2, testConfig);
            expect(result.success).toBe(true);
            expect(result.remaining).toBe(2);
        });
    });

    describe('RATE_LIMIT_CONFIGS', () => {
        it('should have generate config', () => {
            expect(RATE_LIMIT_CONFIGS.generate).toBeDefined();
            expect(RATE_LIMIT_CONFIGS.generate.maxRequests).toBe(10);
            expect(RATE_LIMIT_CONFIGS.generate.windowMs).toBe(60000);
        });

        it('should have upload config', () => {
            expect(RATE_LIMIT_CONFIGS.upload).toBeDefined();
            expect(RATE_LIMIT_CONFIGS.upload.maxRequests).toBe(20);
            expect(RATE_LIMIT_CONFIGS.upload.windowMs).toBe(60000);
        });

        it('should have api config', () => {
            expect(RATE_LIMIT_CONFIGS.api).toBeDefined();
            expect(RATE_LIMIT_CONFIGS.api.maxRequests).toBe(100);
            expect(RATE_LIMIT_CONFIGS.api.windowMs).toBe(60000);
        });
    });

    describe('createRateLimitHeaders', () => {
        it('should create correct headers for allowed request', () => {
            const result = {
                success: true,
                remaining: 5,
                resetTime: Date.now() + 60000,
            };
            const config = { windowMs: 60000, maxRequests: 10 };

            const headers = createRateLimitHeaders(result, config);

            expect(headers.get('X-RateLimit-Limit')).toBe('10');
            expect(headers.get('X-RateLimit-Remaining')).toBe('5');
            expect(headers.get('X-RateLimit-Reset')).toBeDefined();
        });

        it('should include Retry-After for blocked requests', () => {
            const result = {
                success: false,
                remaining: 0,
                resetTime: Date.now() + 30000,
                retryAfter: 30,
            };
            const config = { windowMs: 60000, maxRequests: 10 };

            const headers = createRateLimitHeaders(result, config);

            expect(headers.get('Retry-After')).toBe('30');
        });
    });

    describe('createRateLimitedResponse', () => {
        it('should create 429 response', () => {
            const result = {
                success: false,
                remaining: 0,
                resetTime: Date.now() + 30000,
                retryAfter: 30,
            };
            const config = { windowMs: 60000, maxRequests: 10 };

            const response = createRateLimitedResponse(result, config);

            expect(response.status).toBe(429);
            expect(response.headers.get('Content-Type')).toBe('application/json');
            expect(response.headers.get('Retry-After')).toBe('30');
        });

        it('should include error message in body', async () => {
            const result = {
                success: false,
                remaining: 0,
                resetTime: Date.now() + 30000,
                retryAfter: 30,
            };
            const config = { windowMs: 60000, maxRequests: 10 };

            const response = createRateLimitedResponse(result, config);
            const body = await response.json();

            expect(body.error).toBe('Too Many Requests');
            expect(body.retryAfter).toBe(30);
        });
    });

    describe('checkRateLimit', () => {
        it('should allow requests within limit', () => {
            const request = new Request('http://localhost/api/test', {
                headers: { 'x-forwarded-for': 'test-ip-unique-1' },
            });

            const result = checkRateLimit(request, 'generate');
            expect(result.allowed).toBe(true);
            if (result.allowed) {
                expect(result.remaining).toBeLessThan(10);
            }
        });

        it('should return response when blocked', () => {
            const ip = 'test-ip-unique-2';

            // Exhaust the limit
            for (let i = 0; i < 10; i++) {
                const request = new Request('http://localhost/api/test', {
                    headers: { 'x-forwarded-for': ip },
                });
                checkRateLimit(request, 'generate');
            }

            // Next request should be blocked
            const request = new Request('http://localhost/api/test', {
                headers: { 'x-forwarded-for': ip },
            });
            const result = checkRateLimit(request, 'generate');

            expect(result.allowed).toBe(false);
            if (!result.allowed) {
                expect(result.response).toBeDefined();
                expect(result.response.status).toBe(429);
            }
        });
    });
});
