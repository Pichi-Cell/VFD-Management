const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const { assertSafeRelativePath } = require('./pathSafety');

let execFileImpl = execFile;

const HOST_RE = /^[a-zA-Z0-9.-]+$/;
const SHARE_RE = /^[a-zA-Z0-9._$ -]+$/;

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
    const smbConfig = validateSmbConfig(resolveConfig(config));
    const host = smbConfig.host;
    const shareName = smbConfig.share;
    const baseParts = assertSafeRelativePath(smbConfig.basePath || '', 'SMB base path');
    const subParts = assertSafeRelativePath(subFolder || '', 'SMB subfolder');
    const fileParts = assertSafeRelativePath(remoteName || '', 'SMB filename');
    const relativeParts = [...baseParts, ...subParts, ...fileParts];
    const suffix = relativeParts.length > 0 ? `\\${relativeParts.join('\\')}` : '';
    const fullPath = `\\\\${host}\\${shareName}${suffix}`;
    console.log('Debug: Resolved SMB target path');
    return fullPath;
};

const testConnection = async (config = {}) => {
    try {
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
    }
};
