const SMB2 = require('smb2');
const fs = require('fs');
const path = require('path');

const getClient = () => {
    try {
        return new SMB2({
            share: `\\\\${process.env.SMB_HOST}\\${process.env.SMB_SHARE}`,
            domain: '',
            username: process.env.SMB_USER,
            password: process.env.SMB_PASS,
        });
    } catch (err) {
        console.error('Error initializing SMB client:', err.message);
        return null;
    }
};

const uploadFile = async (localPath, remoteName) => {
    const smbClient = getClient();
    if (!smbClient) throw new Error('SMB Client not initialized');

    const remotePath = process.env.SMB_BASE_PATH
        ? `${process.env.SMB_BASE_PATH}\\${remoteName}`
        : remoteName;

    return new Promise((resolve, reject) => {
        fs.readFile(localPath, (err, data) => {
            if (err) return reject(err);

            smbClient.writeFile(remotePath, data, (err) => {
                if (err) return reject(err);
                resolve(remotePath);
            });
        });
    });
};

const getFileStream = async (remoteName) => {
    const smbClient = getClient();
    if (!smbClient) throw new Error('SMB Client not initialized');

    const remotePath = process.env.SMB_BASE_PATH
        ? `${process.env.SMB_BASE_PATH}\\${remoteName}`
        : remoteName;

    return new Promise((resolve, reject) => {
        smbClient.readFile(remotePath, (err, data) => {
            if (err) return reject(err);
            resolve(data);
        });
    });
};

const deleteFile = async (remoteName) => {
    const smbClient = getClient();
    if (!smbClient) throw new Error('SMB Client not initialized');

    const remotePath = process.env.SMB_BASE_PATH
        ? `${process.env.SMB_BASE_PATH}\\${remoteName}`
        : remoteName;

    return new Promise((resolve, reject) => {
        smbClient.unlink(remotePath, (err) => {
            if (err) return reject(err);
            resolve();
        });
    });
};

module.exports = {
    uploadFile,
    getFileStream,
    deleteFile
};
