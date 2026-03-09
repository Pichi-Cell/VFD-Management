import { vi } from 'vitest';

export const mPool = {
    query: vi.fn(),
    connect: vi.fn().mockReturnValue({ query: vi.fn(), release: vi.fn() }),
    on: vi.fn(),
    end: vi.fn(),
};

// Direct override for db.js
global.testPool = mPool;
globalThis.mockPool = mPool;
