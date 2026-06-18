import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('SMB client command safety', () => {
    let execFile;

    beforeEach(() => {
        vi.resetModules();
        execFile = vi.fn((command, args, callback) => callback(null, '', ''));
    });

    it('should use execFile argument arrays for net use commands', async () => {
        const smbClientModule = await import('../utils/smbClient.js');
        const smbClient = smbClientModule.default || smbClientModule;
        smbClient._setExecFileForTest(execFile);

        await smbClient.connect({
            host: 'fileserver',
            share: 'repairs',
            user: 'domain\\user',
            pass: 'p@ss & whoami',
            basePath: 'VFD'
        });

        expect(execFile).toHaveBeenNthCalledWith(1, 'net', ['use', '\\\\fileserver\\repairs', '/delete', '/y'], expect.any(Function));
        expect(execFile).toHaveBeenNthCalledWith(2, 'net', ['use', '\\\\fileserver\\repairs', 'p@ss & whoami', '/user:domain\\user', '/persistent:no'], expect.any(Function));
    });

    it('should reject hostile SMB config values', async () => {
        const smbClientModule = await import('../utils/smbClient.js');
        const smbClient = smbClientModule.default || smbClientModule;

        expect(() => smbClient.validateSmbConfig({
            host: 'fileserver',
            share: 'repairs & calc',
            user: 'user',
            pass: 'pass',
            basePath: 'VFD'
        })).toThrow(/Invalid SMB share/);

        expect(() => smbClient.getUNCPath('photo.png', 'PHOTOS', {
            host: 'fileserver',
            share: 'repairs',
            user: 'user',
            pass: 'pass',
            basePath: '../outside'
        })).toThrow(/Invalid SMB base path/);
    });
});
