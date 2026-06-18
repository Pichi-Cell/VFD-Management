const path = require('path');

const sanitizePathSegment = (value, fallback = 'unknown') => {
    const sanitized = String(value ?? '')
        .trim()
        .replace(/\s+/g, '')
        .replace(/[<>:"/\\|?*\x00-\x1F\x7F]+/g, '_')
        .replace(/\.+/g, (dots) => (dots === '.' ? '.' : '_'))
        .replace(/_+/g, '_')
        .replace(/^[_ .-]+|[_ .-]+$/g, '');

    return sanitized || fallback;
};

const assertSafeRelativePath = (relativePath, label = 'path') => {
    const raw = String(relativePath ?? '');
    if (path.isAbsolute(raw) || /^[a-zA-Z]:/.test(raw)) {
        throw new Error(`Invalid ${label}`);
    }

    const parts = raw.split(/[\\/]+/).filter(Boolean);
    if (parts.some((part) => part === '..' || /^[a-zA-Z]:$/.test(part))) {
        throw new Error(`Invalid ${label}`);
    }

    return parts;
};

module.exports = {
    assertSafeRelativePath,
    sanitizePathSegment
};
