import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

describe('Auth Controller', () => {
    let app;
    const pool = globalThis.mockPool;
    const adminToken = () => jwt.sign({ id: 1, role: 'admin' }, process.env.JWT_SECRET);
    const technicianToken = () => jwt.sign({ id: 2, role: 'technician' }, process.env.JWT_SECRET);

    beforeEach(async () => {
        vi.clearAllMocks();
        process.env.JWT_SECRET = 'test-secret';
        process.env.JWT_EXPIRES_IN = '2h';
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

    it('should use JWT_EXPIRES_IN when signing tokens', async () => {
        const hashedPassword = await bcrypt.hash('password123', 10);
        pool.query.mockResolvedValueOnce({
            rows: [{ id: 1, username: 'testuser', password_hash: hashedPassword, role: 'admin' }]
        });

        const res = await request(app)
            .post('/api/auth/login')
            .send({ username: 'testuser', password: 'password123' });

        const decoded = (await import('jsonwebtoken')).default.decode(res.body.token);
        expect(decoded.exp - decoded.iat).toEqual(7200);
    });

    it('should return 400 for invalid credentials', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app)
            .post('/api/auth/login')
            .send({ username: 'wronguser', password: 'password' });

        expect(res.statusCode).toEqual(400);
    });

    it('should not leak raw error messages on server errors', async () => {
        pool.query.mockRejectedValueOnce(new Error('SQL path C:\\secret\\db failed'));

        const res = await request(app)
            .post('/api/auth/login')
            .send({ username: 'testuser', password: 'password123' });

        expect(res.statusCode).toEqual(500);
        expect(res.body).toEqual({ msg: 'Server error during login' });
    });

    it('should deny technicians access to user administration routes', async () => {
        const token = technicianToken();

        const listRes = await request(app).get('/api/auth').set('x-auth-token', token);
        const updateRes = await request(app)
            .put('/api/auth/1')
            .set('x-auth-token', token)
            .send({ username: 'updated', role: 'admin' });
        const deleteRes = await request(app).delete('/api/auth/1').set('x-auth-token', token);
        const registerRes = await request(app)
            .post('/api/auth/register')
            .set('x-auth-token', token)
            .send({ username: 'newtech', password: 'password123', role: 'technician' });

        expect(listRes.statusCode).toEqual(403);
        expect(updateRes.statusCode).toEqual(403);
        expect(deleteRes.statusCode).toEqual(403);
        expect(registerRes.statusCode).toEqual(403);
        expect(pool.query).not.toHaveBeenCalled();
    });

    it('should allow admins to list, register, update, and delete users', async () => {
        const token = adminToken();
        pool.query
            .mockResolvedValueOnce({ rows: [{ id: 1, username: 'admin', role: 'admin', created_at: '2026-01-01' }] })
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [{ id: 3, username: 'newtech', role: 'technician' }] })
            .mockResolvedValueOnce({ rows: [{ id: 3, username: 'renamed', role: 'admin' }] })
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [{ id: 3 }] });

        const listRes = await request(app).get('/api/auth').set('x-auth-token', token);
        const registerRes = await request(app)
            .post('/api/auth/register')
            .set('x-auth-token', token)
            .send({ username: 'newtech', password: 'password123', role: 'technician' });
        const updateRes = await request(app)
            .put('/api/auth/3')
            .set('x-auth-token', token)
            .send({ username: 'renamed', password: 'newpass123', role: 'admin' });
        const deleteRes = await request(app).delete('/api/auth/3').set('x-auth-token', token);

        expect(listRes.statusCode).toEqual(200);
        expect(registerRes.statusCode).toEqual(200);
        expect(registerRes.body).toHaveProperty('token');
        expect(updateRes.statusCode).toEqual(200);
        expect(updateRes.body).toEqual({ id: 3, username: 'renamed', role: 'admin' });
        expect(deleteRes.statusCode).toEqual(200);
    });

    it('should reject invalid user updates', async () => {
        const token = adminToken();

        const blankUsername = await request(app)
            .put('/api/auth/1')
            .set('x-auth-token', token)
            .send({ username: ' ', role: 'technician' });
        const invalidRole = await request(app)
            .put('/api/auth/1')
            .set('x-auth-token', token)
            .send({ username: 'validuser', role: 'owner' });
        const shortPassword = await request(app)
            .put('/api/auth/1')
            .set('x-auth-token', token)
            .send({ username: 'validuser', role: 'admin', password: '123' });

        expect(blankUsername.statusCode).toEqual(400);
        expect(invalidRole.statusCode).toEqual(400);
        expect(shortPassword.statusCode).toEqual(400);
        expect(pool.query).not.toHaveBeenCalled();
    });

    it('should not overwrite password when update password is empty', async () => {
        const token = adminToken();
        pool.query.mockResolvedValueOnce({ rows: [{ id: 2, username: 'techuser', role: 'technician' }] });

        const res = await request(app)
            .put('/api/auth/2')
            .set('x-auth-token', token)
            .send({ username: 'techuser', role: 'technician', password: '' });

        expect(res.statusCode).toEqual(200);
        expect(pool.query).toHaveBeenCalledWith(
            expect.not.stringContaining('password_hash'),
            ['techuser', 'technician', '2']
        );
    });
});
