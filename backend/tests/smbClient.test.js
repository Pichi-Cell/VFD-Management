import { beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';

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

    it('should use smbclient with SMB1 dialects inside Linux containers', async () => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vfd-smb-test-'));
        const localFile = path.join(tmpDir, 'photo.png');
        fs.writeFileSync(localFile, 'image');
        execFile = vi.fn((command, args, options, callback) => callback(null, '', ''));
        const smbClientModule = await import('../utils/smbClient.js');
        const smbClient = smbClientModule.default || smbClientModule;
        smbClient._setExecFileForTest(execFile);
        smbClient._setPlatformForTest('linux');

        try {
            await smbClient.uploadFile(localFile, 'photo.png', 'Repair 1', {
                host: '\\\\175.10.0.59',
                share: 'Desarrollo',
                user: 'jcaminos',
                pass: 'secret',
                basePath: '!variadores\\Informes Variadores'
            });

            const putCall = execFile.mock.calls.at(-1);
            expect(putCall[0]).toBe('smbclient');
            expect(putCall[1]).toEqual(expect.arrayContaining([
                '//175.10.0.59/Desarrollo',
                '-U',
                'jcaminos',
                '-m',
                'NT1',
                '--option=client min protocol=NT1',
                '--option=client max protocol=NT1',
                '-c',
                expect.stringMatching(/^put ".+" "!variadores\/Informes Variadores\/Repair 1\/photo\.png"$/)
            ]));
            expect(putCall[1]).not.toContain('secret');
            expect(putCall[2].env.PASSWD).toBe('secret');
        } finally {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    });
});
