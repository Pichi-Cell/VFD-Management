import { afterEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const buildApp = async (uploadDir, maxSize = '1048576') => {
    vi.resetModules();
    process.env.UPLOAD_DIR = uploadDir;
    process.env.MAX_UPLOAD_SIZE_BYTES = maxSize;

    const upload = (await import('../middleware/upload.js')).default;
    const app = express();

    app.post('/upload', (req, res) => {
        upload.single('image')(req, res, (err) => {
            if (err) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(413).json({ msg: 'Uploaded image is too large' });
                }
                return res.status(400).json({ msg: err.message });
            }

            return res.json({ path: req.file.path, filename: req.file.filename });
        });
    });

    return app;
};

describe('Upload middleware', () => {
    const tempRoots = [];

    afterEach(() => {
        tempRoots.forEach((dir) => fs.rmSync(dir, { recursive: true, force: true }));
        tempRoots.length = 0;
        delete process.env.UPLOAD_DIR;
        delete process.env.MAX_UPLOAD_SIZE_BYTES;
    });

    it('should accept image uploads and write to UPLOAD_DIR', async () => {
        const uploadDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vfd-upload-'));
        tempRoots.push(uploadDir);
        const app = await buildApp(uploadDir);

        const res = await request(app)
            .post('/upload')
            .attach('image', Buffer.from([0x89, 0x50, 0x4e, 0x47]), {
                filename: 'photo.png',
                contentType: 'image/png'
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body.path.startsWith(uploadDir)).toBe(true);
        expect(fs.existsSync(res.body.path)).toBe(true);
    });

    it('should reject invalid file types', async () => {
        const uploadDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vfd-upload-'));
        tempRoots.push(uploadDir);
        const app = await buildApp(uploadDir);

        const res = await request(app)
            .post('/upload')
            .attach('image', Buffer.from('not an image'), {
                filename: 'note.txt',
                contentType: 'text/plain'
            });

        expect(res.statusCode).toEqual(400);
        expect(res.body.msg).toMatch(/Only JPEG, PNG, and WebP/);
    });

    it('should reject oversized files', async () => {
        const uploadDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vfd-upload-'));
        tempRoots.push(uploadDir);
        const app = await buildApp(uploadDir, '4');

        const res = await request(app)
            .post('/upload')
            .attach('image', Buffer.from([0, 1, 2, 3, 4]), {
                filename: 'photo.png',
                contentType: 'image/png'
            });

        expect(res.statusCode).toEqual(413);
        expect(res.body.msg).toMatch(/too large/);
    });
});
