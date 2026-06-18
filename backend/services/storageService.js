const fs = require('fs');
const path = require('path');
const db = require('../db');
const smbClient = require('../utils/smbClient');
const { applyDefaults, rowsToConfig } = require('../config/configSchema');
const { resolveUploadDir } = require('../config/paths');
const { assertSafeRelativePath } = require('../utils/pathSafety');

/**
 * StorageService abstracts file operations.
 * It reads configuration from the database and falls back to environment variables.
 */
class StorageService {
    constructor() {
        this.config = {
            type: process.env.STORAGE_TYPE || 'LOCAL',
            localDir: resolveUploadDir(),
            smb: {
                host: process.env.SMB_HOST || '',
                share: process.env.SMB_SHARE || '',
                user: process.env.SMB_USER || '',
                pass: process.env.SMB_PASS || '',
                basePath: process.env.SMB_BASE_PATH || ''
            }
        };
        this.initialized = false;
    }

    async init() {
        try {
            const result = await db.query('SELECT key, value FROM vfd.settings');
            const settings = rowsToConfig(result.rows);
            const config = applyDefaults(settings);

            // Fallback Logic: DB -> .env -> Default
            const types = [settings.STORAGE_TYPE, process.env.STORAGE_TYPE, 'LOCAL'];
            this.config.type = types.find(t => t !== undefined && t !== null);

            const dirs = [settings.UPLOAD_DIR, process.env.UPLOAD_DIR, process.env.UPLOADS_DIR];
            this.config.localDir = resolveUploadDir(dirs.find(d => d !== undefined && d !== null));
            this.config.smb = {
                host: settings.SMB_HOST ?? process.env.SMB_HOST ?? config.SMB_HOST,
                share: settings.SMB_SHARE ?? process.env.SMB_SHARE ?? config.SMB_SHARE,
                user: settings.SMB_USER ?? process.env.SMB_USER ?? config.SMB_USER,
                pass: settings.SMB_PASS ?? process.env.SMB_PASS ?? config.SMB_PASS,
                basePath: settings.SMB_BASE_PATH ?? process.env.SMB_BASE_PATH ?? config.SMB_BASE_PATH
            };

            // Auto-Persistence: If from .env and not in DB, save it
            await this.saveEnvSettingIfMissing(settings, 'STORAGE_TYPE', process.env.STORAGE_TYPE);
            await this.saveEnvSettingIfMissing(settings, 'UPLOAD_DIR', process.env.UPLOAD_DIR || process.env.UPLOADS_DIR);
            await this.saveEnvSettingIfMissing(settings, 'SMB_HOST', process.env.SMB_HOST);
            await this.saveEnvSettingIfMissing(settings, 'SMB_SHARE', process.env.SMB_SHARE);
            await this.saveEnvSettingIfMissing(settings, 'SMB_USER', process.env.SMB_USER);
            await this.saveEnvSettingIfMissing(settings, 'SMB_PASS', process.env.SMB_PASS);
            await this.saveEnvSettingIfMissing(settings, 'SMB_BASE_PATH', process.env.SMB_BASE_PATH);

            this.initialized = true;
            console.log(`[SYSTEM] Storage initialized | Type: ${this.config.type} | Path: ${this.config.localDir}`);
        } catch (err) {
            console.warn('[SYSTEM] Storage failed to init from DB, using fallback:', err.message);
        }

        if (this.config.type === 'LOCAL') {
            if (!fs.existsSync(this.config.localDir)) {
                fs.mkdirSync(this.config.localDir, { recursive: true });
            }
        }
    }

    async uploadFile(localPath, filename, subFolder = '') {
        if (!this.initialized) await this.init();

        if (this.config.type === 'SMB') {
            return await smbClient.uploadFile(localPath, filename, subFolder, this.config.smb);
        } else {
            const targetDir = this.resolveLocalPath(subFolder);
            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
            }
            const targetPath = this.resolveLocalPath(subFolder, filename);
            fs.copyFileSync(localPath, targetPath);
            return targetPath;
        }
    }

    async getFileBuffer(filename, subFolder = '') {
        if (!this.initialized) await this.init();

        if (this.config.type === 'SMB') {
            return await smbClient.getFileBuffer(filename, subFolder, this.config.smb);
        } else {
            const filePath = this.resolveLocalPath(subFolder, filename);
            return fs.readFileSync(filePath);
        }
    }

    async deleteFile(filename, subFolder = '') {
        if (!this.initialized) await this.init();

        if (this.config.type === 'SMB') {
            await smbClient.deleteFile(filename, subFolder, this.config.smb);
        } else {
            const filePath = this.resolveLocalPath(subFolder, filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
    }

    async setType(type) {
        if (!['LOCAL', 'SMB'].includes(type)) throw new Error('Invalid storage type');
        await db.query('INSERT INTO vfd.settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2', ['STORAGE_TYPE', type]);
        this.config.type = type;
    }

    async saveEnvSettingIfMissing(settings, key, value) {
        if (value !== undefined && value !== null && !settings[key]) {
            await db.query(
                'INSERT INTO vfd.settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
                [key, value.toString()]
            );
        }
    }

    resolveLocalPath(subFolder = '', filename = '') {
        const localRoot = path.resolve(this.config.localDir);
        const subParts = assertSafeRelativePath(subFolder, 'subfolder');
        const fileParts = filename ? assertSafeRelativePath(filename, 'filename') : [];
        const targetPath = path.resolve(localRoot, ...subParts, ...fileParts);

        if (targetPath !== localRoot && !targetPath.startsWith(localRoot + path.sep)) {
            throw new Error('Resolved file path is outside upload root');
        }

        return targetPath;
    }
}

module.exports = new StorageService();
