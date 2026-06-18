const { execFile } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { assertSafeRelativePath } = require('./pathSafety');

let execFileImpl = execFile;
let platformImpl = process.platform;

const HOST_RE = /^[a-zA-Z0-9.-]+$/;
const SHARE_RE = /^[a-zA-Z0-9._$ -]+$/;
const SMB_COMMAND_UNSAFE_RE = /[";\r\n]/;

const isWindows = () => platformImpl === 'win32';

const assertSmbCommandSafeParts = (parts, label) => {
    for (const part of parts) {
        if (SMB_COMMAND_UNSAFE_RE.test(part)) {
            throw new Error(`Invalid ${label}`);
        }
    }
};

const smbQuote = (value) => `"${String(value).replace(/\\/g, '/')}"`;

const execSmbClient = (smbConfig, command, options = {}) => {
    const args = [
        `//${smbConfig.host}/${smbConfig.share}`,
        '-U',
        smbConfig.user,
        '-m',
        'NT1',
        '--option=client min protocol=NT1',
        '--option=client max protocol=NT1',
        '-c',
        command
    ];

    const env = {
        ...process.env,
        PASSWD: smbConfig.pass || ''
    };

    return new Promise((resolve, reject) => {
        execFileImpl('smbclient', args, {
            env,
            encoding: options.encoding || 'utf8',
            maxBuffer: options.maxBuffer || 20 * 1024 * 1024
        }, (error, stdout, stderr) => {
            if (error && !options.ignoreError) {
                const message = stderr || error.message;
                console.error('SMB Client Error:', message);
                return reject(new Error('Failed to access SMB share'));
            }

            resolve({ stdout, stderr, error });
        });
    });
};

const getRemoteParts = (remoteName = '', subFolder = '', config = {}) => {
    const smbConfig = validateSmbConfig(resolveConfig(config));
    const baseParts = assertSafeRelativePath(smbConfig.basePath || '', 'SMB base path');
    const subParts = assertSafeRelativePath(subFolder || '', 'SMB subfolder');
    const fileParts = remoteName ? assertSafeRelativePath(remoteName, 'SMB filename') : [];

    assertSmbCommandSafeParts([...baseParts, ...subParts, ...fileParts], 'SMB path');

    return {
        smbConfig,
        baseParts,
        subParts,
        fileParts,
        remoteParts: [...baseParts, ...subParts, ...fileParts],
        directoryParts: [...baseParts, ...subParts]
    };
};

const toSmbPath = (parts) => parts.join('/');

const ensureLinuxRemoteDir = async (directoryParts, config) => {
    for (let i = 1; i <= directoryParts.length; i += 1) {
        const dir = toSmbPath(directoryParts.slice(0, i));
        await execSmbClient(config, `mkdir ${smbQuote(dir)}`, { ignoreError: true });
    }
};

const validateSmbConfig = (config) => {
    if (!config.host || !HOST_RE.test(config.host) || config.host.includes('..')) {
        throw new Error('Invalid SMB host');
    }

    if (!config.share || !SHARE_RE.test(config.share) || config.share.includes('..')) {
        throw new Error('Invalid SMB share');
    }

    const baseParts = assertSafeRelativePath(config.basePath || '', 'SMB base path');
    return {
        ...config,
        basePath: baseParts.join('\\')
    };
};

const resolveConfig = (config = {}) => ({
    host: (config.host ?? process.env.SMB_HOST ?? '').replace(/\\/g, ''),
    share: config.share ?? process.env.SMB_SHARE ?? '',
    user: config.user ?? process.env.SMB_USER ?? '',
    pass: config.pass ?? process.env.SMB_PASS ?? '',
    basePath: config.basePath ?? process.env.SMB_BASE_PATH ?? ''
});

/**
 * Ensures the network share is connected using 'net use'.
 * This is necessary for SMB1 support on Windows.
 */
const connect = (config = {}) => {
    const smbConfig = validateSmbConfig(resolveConfig(config));
    const host = smbConfig.host;
    const shareName = smbConfig.share;
    const uncPath = `\\\\${host}\\${shareName}`;
    const user = smbConfig.user;
    const pass = smbConfig.pass;

    return new Promise((resolve, reject) => {
        if (!isWindows()) {
            execSmbClient(smbConfig, 'pwd')
                .then(() => {
                    console.log('SMB Connected successfully');
                    resolve(`//${host}/${shareName}`);
                })
                .catch(() => reject(new Error('Failed to connect to SMB share')));
            return;
        }

        // First, check if already connected or clear existing connection to be sure
        execFileImpl('net', ['use', uncPath, '/delete', '/y'], () => {
            // Now attempt to connect
            const args = ['use', uncPath, pass, `/user:${user}`, '/persistent:no'];

            console.log(`Debug: Authenticating SMB share as ${user}`);

            execFileImpl('net', args, (error, stdout, stderr) => {
                if (error) {
                    console.error('SMB Connection Error:', stderr || error.message);
                    return reject(new Error('Failed to connect to SMB share'));
                }
                console.log('SMB Connected successfully');
                resolve(uncPath);
            });
        });
    });
};

/**
 * Disconnects the network share.
 */
const disconnect = (config = {}) => {
    const smbConfig = validateSmbConfig(resolveConfig(config));
    const host = smbConfig.host;
    const shareName = smbConfig.share;
    const uncPath = `\\\\${host}\\${shareName}`;

    return new Promise((resolve) => {
        if (!isWindows()) {
            resolve();
            return;
        }

        execFileImpl('net', ['use', uncPath, '/delete', '/y'], (error) => {
            if (error) {
                console.warn(`Debug: Error during disconnect (already disconnected?): ${error.message}`);
            } else {
                console.log('SMB Disconnected successfully');
            }
            resolve();
        });
    });
};

const getUNCPath = (remoteName, subFolder = '', config = {}) => {
    const { smbConfig, remoteParts } = getRemoteParts(remoteName, subFolder, config);
    const host = smbConfig.host;
    const shareName = smbConfig.share;
    const suffix = remoteParts.length > 0 ? `\\${remoteParts.join('\\')}` : '';
    const fullPath = `\\\\${host}\\${shareName}${suffix}`;
    console.log('Debug: Resolved SMB target path');
    return fullPath;
};

const testConnection = async (config = {}) => {
    try {
        if (!isWindows()) {
            const { smbConfig, baseParts } = getRemoteParts('', '', config);
            const command = baseParts.length > 0 ? `ls ${smbQuote(toSmbPath(baseParts))}` : 'ls';
            await execSmbClient(smbConfig, command);
            return { success: true, isDirectory: true };
        }

        const uncPath = await connect(config);
        const stats = fs.statSync(uncPath);
        return { success: true, isDirectory: stats.isDirectory() };
    } catch (err) {
        return { success: false, message: err.message };
    } finally {
        await disconnect(config);
    }
};

const uploadFile = async (localPath, remoteName, subFolder = '', config = {}) => {
    if (!isWindows()) {
        const { smbConfig, remoteParts, directoryParts } = getRemoteParts(remoteName, subFolder, config);
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vfd-smb-'));
        const tmpFile = path.join(tmpDir, 'upload.bin');

        try {
            fs.copyFileSync(localPath, tmpFile);
            await ensureLinuxRemoteDir(directoryParts, smbConfig);
            await execSmbClient(smbConfig, `put ${smbQuote(tmpFile)} ${smbQuote(toSmbPath(remoteParts))}`);
            return `//${smbConfig.host}/${smbConfig.share}/${toSmbPath(remoteParts)}`;
        } finally {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    }

    try {
        await connect(config);
        const remoteUNC = getUNCPath(remoteName, subFolder, config);

        // Ensure parent directory exists (recursive)
        const remoteDir = path.dirname(remoteUNC);
        if (!fs.existsSync(remoteDir)) {
            fs.mkdirSync(remoteDir, { recursive: true });
        }

        return new Promise((resolve, reject) => {
            try {
                fs.copyFileSync(localPath, remoteUNC);
                resolve(remoteUNC);
            } catch (err) {
                console.error(`Upload Error: ${err.message}`);
                reject(err);
            }
        });
    } finally {
        await disconnect(config);
    }
};

const getFileBuffer = async (remoteName, subFolder = '', config = {}) => {
    if (!isWindows()) {
        const { smbConfig, remoteParts } = getRemoteParts(remoteName, subFolder, config);
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vfd-smb-'));
        const tmpFile = path.join(tmpDir, path.basename(remoteParts[remoteParts.length - 1]));

        try {
            await execSmbClient(smbConfig, `get ${smbQuote(toSmbPath(remoteParts))} ${smbQuote(tmpFile)}`);
            return fs.readFileSync(tmpFile);
        } finally {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    }

    try {
        await connect(config);
        const remoteUNC = getUNCPath(remoteName, subFolder, config);

        return new Promise((resolve, reject) => {
            try {
                const data = fs.readFileSync(remoteUNC);
                resolve(data);
            } catch (err) {
                console.error(`Read Error: ${err.message}`);
                reject(err);
            }
        });
    } finally {
        await disconnect(config);
    }
};

const deleteFile = async (remoteName, subFolder = '', config = {}) => {
    if (!isWindows()) {
        const { smbConfig, remoteParts } = getRemoteParts(remoteName, subFolder, config);
        await execSmbClient(smbConfig, `del ${smbQuote(toSmbPath(remoteParts))}`);
        return;
    }

    try {
        await connect(config);
        const remoteUNC = getUNCPath(remoteName, subFolder, config);

        return new Promise((resolve, reject) => {
            try {
                fs.unlinkSync(remoteUNC);
                resolve();
            } catch (err) {
                console.error(`Delete Error: ${err.message}`);
                reject(err);
            }
        });
    } finally {
        await disconnect(config);
    }
};

module.exports = {
    connect,
    testConnection,
    uploadFile,
    getFileBuffer,
    deleteFile,
    disconnect,
    getUNCPath,
    validateSmbConfig,
    _setExecFileForTest: (mockExecFile) => {
        execFileImpl = mockExecFile || execFile;
    },
    _setPlatformForTest: (platform) => {
        platformImpl = platform || process.platform;
    }
};
