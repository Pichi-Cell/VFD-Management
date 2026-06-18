import { describe, expect, it } from 'vitest';

describe('Path safety helpers', () => {
    it('should sanitize database values before they become path segments', async () => {
        const pathSafetyModule = await import('../utils/pathSafety.js');
        const { sanitizePathSegment } = pathSafetyModule.default || pathSafetyModule;

        expect(sanitizePathSegment('../../outside')).toBe('outside');
        expect(sanitizePathSegment('ACME\\Plant/Line:1')).toBe('ACME_Plant_Line_1');
        expect(sanitizePathSegment('\u0000')).toBe('unknown');
    });
});
