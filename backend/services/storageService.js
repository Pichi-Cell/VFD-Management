const fs = require('fs');
const path = require('path');
const db = require('../db');
const smbClient = require('../utils/smbClient');

/**
 * StorageService abstracts file operations.
 * It reads configuration from the database and falls back to environment variables.
 */
class StorageService {
    constructor() {
        this.config = {
            type: process.env.STORAGE_TYPE || 'LOCAL',
            localDir: process.env.UPLOAD_DIR || path.join(__dirname, '../uploads')
        };
        this.initialized = false;
    }

    async init() {
        try {
            const result = await db.query('SELECT key, value FROM vfd.settings');
            const settings = {};
            result.rows.forEach(row => {
                settings[row.key] = row.value;
            });

            // Fallback Logic: DB -> .env -> Default
            const types = [settings.STORAGE_TYPE, process.env.STORAGE_TYPE, 'LOCAL'];
            this.config.type = types.find(t => t !== undefined && t !== null);

            const dirs = [settings.UPLOAD_DIR, process.env.UPLOAD_DIR, path.join(__dirname, '../uploads')];
            this.config.localDir = dirs.find(d => d !== undefined && d !== null);

            // Auto-Persistence: If from .env and not in DB, save it
            if (!settings.STORAGE_TYPE && process.env.STORAGE_TYPE) {
                await this.setType(process.env.STORAGE_TYPE);
            }
            if (!settings.UPLOAD_DIR && process.env.UPLOAD_DIR) {
                await db.query('INSERT INTO vfd.settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2', ['UPLOAD_DIR', process.env.UPLOAD_DIR]);
            }

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
            return await smbClient.uploadFile(localPath, filename, subFolder);
        } else {
            const targetDir = path.join(this.config.localDir, subFolder);
            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
            }
            const targetPath = path.join(targetDir, filename);
            fs.copyFileSync(localPath, targetPath);
            return targetPath;
        }
    }

    async getFileBuffer(filename, subFolder = '') {
        if (!this.initialized) await this.init();

        if (this.config.type === 'SMB') {
            return await smbClient.getFileBuffer(filename, subFolder);
        } else {
            const filePath = path.join(this.config.localDir, subFolder, filename);
            return fs.readFileSync(filePath);
        }
    }

    async deleteFile(filename, subFolder = '') {
        if (!this.initialized) await this.init();

        if (this.config.type === 'SMB') {
            await smbClient.deleteFile(filename, subFolder);
        } else {
            const filePath = path.join(this.config.localDir, subFolder, filename);
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
}

module.exports = new StorageService();
