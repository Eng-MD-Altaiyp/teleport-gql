import { describe, expect, it } from 'vitest';
import { isAbsoluteUrl, joinUrl, resolveFinalUrl } from './url';

describe('isAbsoluteUrl', () => {
    it('detects http/https', () => {
        expect(isAbsoluteUrl('http://a.com')).toBe(true);
        expect(isAbsoluteUrl('https://a.com')).toBe(true);
    });
    it('detects scheme-relative', () => {
        expect(isAbsoluteUrl('//a.com/api')).toBe(true);
    });
    it('handles relative', () => {
        expect(isAbsoluteUrl('/api')).toBe(false);
        expect(isAbsoluteUrl('api')).toBe(false);
    });
});

describe('joinUrl', () => {
    const base = 'https://a.com';
    it('base no slash + path with slash', () => {
        expect(joinUrl(base, '/api')).toBe('https://a.com/api');
    });
    it('base slash + path slash', () => {
        expect(joinUrl('https://a.com/', '/api')).toBe('https://a.com/api');
    });
    it('base no slash + path no slash', () => {
        expect(joinUrl(base, 'api')).toBe('https://a.com/api');
    });
    it('base slash + path no slash', () => {
        expect(joinUrl('https://a.com/', 'api')).toBe('https://a.com/api');
    });
});

describe('resolveFinalUrl', () => {
    it('returns absolute unchanged', () => {
        const res = resolveFinalUrl('https://a.com', 'https://b.com/x');
        expect(res.finalUrl).toBe('https://b.com/x');
        expect(res.kind).toBe('absolute');
    });

    it('joins relative with base', () => {
        const res = resolveFinalUrl('https://a.com', '/api');
        expect(res.finalUrl).toBe('https://a.com/api');
        expect(res.kind).toBe('relative');
    });

    it('errors when relative without base', () => {
        const res = resolveFinalUrl('', '/api');
        expect(res.error).toBeTruthy();
    });

    it('flags invalid base', () => {
        const res = resolveFinalUrl('not-a-url', '/api');
        expect(res.error).toBe('Base URL غير صالح');
    });

    it('handles scheme-relative', () => {
        const res = resolveFinalUrl('', '//example.com/api');
        expect(res.finalUrl).toBe('https://example.com/api');
        expect(res.kind).toBe('scheme-relative');
    });
});
