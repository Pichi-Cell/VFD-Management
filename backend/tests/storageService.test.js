import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

describe('StorageService', () => {
    const pool = globalThis.mockPool;

    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
        process.env.STORAGE_TYPE = 'SMB';
        process.env.SMB_HOST = 'env-host';
        process.env.SMB_SHARE = 'env-share';
        process.env.SMB_USER = 'env-user';
        process.env.SMB_PASS = 'env-pass';
        process.env.SMB_BASE_PATH = 'env-base';
    });

    afterEach(() => {
        delete process.env.STORAGE_TYPE;
        delete process.env.SMB_HOST;
        delete process.env.SMB_SHARE;
        delete process.env.SMB_USER;
        delete process.env.SMB_PASS;
        delete process.env.SMB_BASE_PATH;
    });

    it('should prefer DB SMB settings over environment variables', async () => {
        pool.query.mockResolvedValue({
            rows: [
                { key: 'STORAGE_TYPE', value: 'SMB' },
                { key: 'SMB_HOST', value: 'db-host' },
                { key: 'SMB_SHARE', value: 'db-share' },
                { key: 'SMB_USER', value: 'db-user' },
                { key: 'SMB_PASS', value: 'db-pass' },
                { key: 'SMB_BASE_PATH', value: 'db-base' }
            ]
        });

        const storageService = (await import('../services/storageService.js')).default;
        await storageService.init();

        expect(storageService.config.smb).toEqual({
            host: 'db-host',
            share: 'db-share',
            user: 'db-user',
            pass: 'db-pass',
            basePath: 'db-base'
        });
    });

    it('should reject local read/write/delete traversal outside upload root', async () => {
        process.env.STORAGE_TYPE = 'LOCAL';
        const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vfd-storage-'));
        const source = path.join(root, 'source.png');
        fs.writeFileSync(source, 'image');

        const storageService = (await import('../services/storageService.js')).default;
        storageService.initialized = true;
        storageService.config.type = 'LOCAL';
        storageService.config.localDir = root;

        await expect(storageService.uploadFile(source, 'photo.png', '../../outside')).rejects.toThrow(/Invalid subfolder/);
        await expect(storageService.getFileBuffer('..\\secret.txt', 'safe')).rejects.toThrow(/Invalid filename/);
        await expect(storageService.deleteFile('photo.png', 'safe/../outside')).rejects.toThrow(/Invalid subfolder/);

        fs.rmSync(root, { recursive: true, force: true });
    });

    it('should allow safe local paths and keep them under upload root', async () => {
        process.env.STORAGE_TYPE = 'LOCAL';
        const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vfd-storage-'));
        const source = path.join(root, 'source.png');
        fs.writeFileSync(source, 'image');

        const storageService = (await import('../services/storageService.js')).default;
        storageService.initialized = true;
        storageService.config.type = 'LOCAL';
        storageService.config.localDir = root;

        const written = await storageService.uploadFile(source, 'photo.png', 'Client-123/PHOTOS');
        expect(written.startsWith(path.resolve(root) + path.sep)).toBe(true);
        expect(await storageService.getFileBuffer('photo.png', 'Client-123/PHOTOS')).toEqual(Buffer.from('image'));
        await storageService.deleteFile('photo.png', 'Client-123/PHOTOS');
        expect(fs.existsSync(written)).toBe(false);

        fs.rmSync(root, { recursive: true, force: true });
    });
});
