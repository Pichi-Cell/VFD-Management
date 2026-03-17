import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

describe('Config Controller', () => {
    let app;
    const pool = globalThis.mockPool;
    const JWT_SECRET = 'test-secret';

    beforeAll(() => {
        process.env.JWT_SECRET = JWT_SECRET;
    });

    beforeEach(async () => {
        vi.clearAllMocks();
        const configRoutes = (await import('../routes/config')).default;
        app = express();
        app.use(express.json());
        app.use('/api/config', configRoutes);
    });

    const generateToken = (role) => {
        return jwt.sign({ id: 1, role }, JWT_SECRET);
    };

    it('should return 401 if no token provided', async () => {
        const res = await request(app).get('/api/config');
        expect(res.statusCode).toEqual(401);
    });

    it('should return 403 if user is not admin', async () => {
        const token = generateToken('technician');
        const res = await request(app)
            .get('/api/config')
            .set('x-auth-token', token);
        expect(res.statusCode).toEqual(403);
        expect(res.body.msg).toMatch(/Administrator privileges required/);
    });

    it('should return config if user is admin', async () => {
        const token = generateToken('admin');
        pool.query.mockResolvedValueOnce({
            rows: [
                { key: 'STORAGE_TYPE', value: 'LOCAL' },
                { key: 'UPLOAD_DIR', value: '/test/uploads' }
            ]
        });

        const res = await request(app)
            .get('/api/config')
            .set('x-auth-token', token);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual({
            STORAGE_TYPE: 'LOCAL',
            UPLOAD_DIR: '/test/uploads'
        });
    });

    it('should update config if user is admin', async () => {
        const token = generateToken('admin');
        pool.query.mockResolvedValue({ rows: [] });

        const res = await request(app)
            .post('/api/config')
            .set('x-auth-token', token)
            .send({
                EMAIL_HOST: 'smtp.test.com',
                EMAIL_PORT: '587'
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body.msg).toEqual('Configuration updated successfully');

        // Check that at least the BEGIN and COMMIT were called
        expect(pool.query).toHaveBeenCalledWith('BEGIN');
        expect(pool.query).toHaveBeenCalledWith('COMMIT');

        // Check that at least one of the keys was attempted to be inserted
        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining('INSERT INTO vfd.settings'),
            expect.arrayContaining(['EMAIL_HOST', 'smtp.test.com'])
        );
    });
});
