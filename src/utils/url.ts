export const isAbsoluteUrl = (input: string): boolean => {
    if (!input) return false;
    return /^(https?:)?\/\//i.test(input);
};

export const joinUrl = (baseUrl: string, path: string): string => {
    if (!baseUrl) return path;

    // Preserve query/hash inside path
    const baseEndsWithSlash = baseUrl.endsWith('/');
    const pathStartsWithSlash = path.startsWith('/');

    if (baseEndsWithSlash && pathStartsWithSlash) {
        return baseUrl + path.slice(1);
    }
    if (!baseEndsWithSlash && !pathStartsWithSlash) {
        return `${baseUrl}/${path}`;
    }
    return baseUrl + path;
};

interface ResolveResult {
    finalUrl: string;
    kind: 'absolute' | 'scheme-relative' | 'relative' | 'empty';
    error?: string;
    warning?: string;
}

export const resolveFinalUrl = (
    baseUrl: string | undefined,
    rawInput: string,
    defaultScheme: 'https' | 'http' = 'https'
): ResolveResult => {
    const trimmed = rawInput.trim();
    if (!trimmed) return { finalUrl: '', kind: 'empty' };

    if (/^https?:\/\//i.test(trimmed)) {
        return { finalUrl: trimmed, kind: 'absolute' };
    }

    if (/^\/\//.test(trimmed)) {
        const finalUrl = `${defaultScheme}:${trimmed}`;
        return { finalUrl, kind: 'scheme-relative', warning: 'تم تحويل الرابط إلى https لأنه بدون بروتوكول.' };
    }

    // relative path
    if (!baseUrl) {
        return {
            finalUrl: trimmed,
            kind: 'relative',
            error: 'اختر Environment تحتوي Base URL أو أدخل URL كامل',
        };
    }

    try {
        // validate base URL
        // eslint-disable-next-line no-new
        new URL(baseUrl);
    } catch {
        return {
            finalUrl: trimmed,
            kind: 'relative',
            error: 'Base URL غير صالح',
        };
    }

    const finalUrl = joinUrl(baseUrl, trimmed);
    return { finalUrl, kind: 'relative' };
};
