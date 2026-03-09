import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import bcrypt from 'bcryptjs';

describe('Auth Controller', () => {
    let app;
    const pool = globalThis.mockPool;

    beforeEach(async () => {
        vi.clearAllMocks();
        process.env.JWT_SECRET = 'test-secret';
        const authRoutes = (await import('../routes/auth')).default;
        app = express();
        app.use(express.json());
        app.use('/api/auth', authRoutes);
    });

    it('should login successfully with correct credentials', async () => {
        const hashedPassword = await bcrypt.hash('password123', 10);
        pool.query.mockResolvedValueOnce({
            rows: [{ id: 1, username: 'testuser', password_hash: hashedPassword, role: 'admin' }]
        });

        const res = await request(app)
            .post('/api/auth/login')
            .send({ username: 'testuser', password: 'password123' });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
    });

    it('should return 400 for invalid credentials', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app)
            .post('/api/auth/login')
            .send({ username: 'wronguser', password: 'password' });

        expect(res.statusCode).toEqual(400);
    });
});
