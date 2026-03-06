const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Ensures the network share is connected using 'net use'.
 * This is necessary for SMB1 support on Windows.
 */
const connect = () => {
    const host = (process.env.SMB_HOST || '').replace(/\\/g, '');
    const shareName = process.env.SMB_SHARE || '';
    const uncPath = `\\\\${host}\\${shareName}`;
    const user = process.env.SMB_USER || '';
    const pass = process.env.SMB_PASS || '';

    return new Promise((resolve, reject) => {
        // First, check if already connected or clear existing connection to be sure
        exec(`net use ${uncPath} /delete /y`, () => {
            // Now attempt to connect
            const command = `net use ${uncPath} "${pass}" /user:"${user}" /persistent:no`;

            console.log(`Debug: Authenticating with ${uncPath} as ${user}`);

            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error('SMB Connection Error:', stderr || error.message);
                    return reject(new Error(`Failed to connect to SMB share: ${stderr || error.message}`));
                }
                console.log('SMB Connected successfully');
                resolve(uncPath);
            });
        });
    });
};

const getUNCPath = (remoteName, subFolder = '') => {
    const host = (process.env.SMB_HOST || '').replace(/\\/g, '');
    const shareName = (process.env.SMB_SHARE || '').replace(/\\/g, '');
    let basePath = (process.env.SMB_BASE_PATH || '').replace(/\//g, '\\');

    if (basePath && !basePath.endsWith('\\')) {
        basePath += '\\';
    }

    // Handle subFolder with backslashes
    let normalizedSubFolder = subFolder.replace(/\//g, '\\');
    if (normalizedSubFolder && !normalizedSubFolder.endsWith('\\')) {
        normalizedSubFolder += '\\';
    }

    const fullPath = `\\\\${host}\\${shareName}\\${basePath}${normalizedSubFolder}${remoteName}`;
    console.log(`Debug: UNC Path: "${fullPath}"`);
    return fullPath;
};

const testConnection = async () => {
    try {
        const uncPath = await connect();
        const stats = fs.statSync(uncPath);
        return { success: true, isDirectory: stats.isDirectory() };
    } catch (err) {
        return { success: false, message: err.message };
    }
};

const uploadFile = async (localPath, remoteName, subFolder = '') => {
    await connect();
    const remoteUNC = getUNCPath(remoteName, subFolder);

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
};

const getFileBuffer = async (remoteName, subFolder = '') => {
    await connect();
    const remoteUNC = getUNCPath(remoteName, subFolder);

    return new Promise((resolve, reject) => {
        try {
            const data = fs.readFileSync(remoteUNC);
            resolve(data);
        } catch (err) {
            console.error(`Read Error: ${err.message}`);
            reject(err);
        }
    });
};

const deleteFile = async (remoteName, subFolder = '') => {
    await connect();
    const remoteUNC = getUNCPath(remoteName, subFolder);

    return new Promise((resolve, reject) => {
        try {
            fs.unlinkSync(remoteUNC);
            resolve();
        } catch (err) {
            console.error(`Delete Error: ${err.message}`);
            reject(err);
        }
    });
};

module.exports = {
    testConnection,
    uploadFile,
    getFileBuffer,
    deleteFile
};