import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

const secret = 'test-secret';
process.env.JWT_SECRET = secret;
const dummyToken = jwt.sign({ id: 1, username: 'tester' }, secret);

describe('VFDs Controller', () => {
    let app;
    const pool = globalThis.mockPool;

    beforeEach(async () => {
        vi.clearAllMocks();
        const vfdRoutes = (await import('../routes/vfds')).default;
        app = express();
        app.use(express.json());
        app.use('/api/vfds', vfdRoutes);
    });

    it('should create a VFD with valid data', async () => {
        pool.query.mockResolvedValueOnce({ rows: [{ id: 1, serial_number: 'SN123', internal_number: 123 }] });

        const res = await request(app)
            .post('/api/vfds')
            .set('x-auth-token', dummyToken)
            .send({ serial_number: 'SN123', internal_number: 123, client_id: 1, model_id: 1 });

        expect(res.statusCode).toEqual(200);
        expect(res.body.internal_number).toBe(123);
    });

    it('should return 400 for non-integer internal_number', async () => {
        const res = await request(app)
            .post('/api/vfds')
            .set('x-auth-token', dummyToken)
            .send({ serial_number: 'SN123', internal_number: 'not-an-int', client_id: 1, model_id: 1 });

        expect(res.statusCode).toEqual(400);
        expect(JSON.stringify(res.body)).toContain('must be an integer');
    });

    it('should return 401 for unauthorized POST /api/vfds', async () => {
        const res = await request(app).post('/api/vfds').send({});
        expect(res.statusCode).toEqual(401);
    });

    it('should delete orphan VFDs before deleting a model with no repairs', async () => {
        pool.query
            .mockResolvedValueOnce({}) // BEGIN
            .mockResolvedValueOnce({ rows: [] }) // repair check
            .mockResolvedValueOnce({}) // delete orphan VFDs
            .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // delete model
            .mockResolvedValueOnce({}); // COMMIT

        const res = await request(app)
            .delete('/api/vfds/models/1')
            .set('x-auth-token', dummyToken);

        expect(res.statusCode).toEqual(200);
        expect(res.body.msg).toBe('VFD model removed');
        expect(pool.query).toHaveBeenCalledWith('DELETE FROM vfd.vfds WHERE model_id = $1', ['1']);
    });

    it('should block model deletion while repairs still exist', async () => {
        pool.query
            .mockResolvedValueOnce({}) // BEGIN
            .mockResolvedValueOnce({ rows: [{ '?column?': 1 }] }) // repair check
            .mockResolvedValueOnce({}); // ROLLBACK

        const res = await request(app)
            .delete('/api/vfds/models/1')
            .set('x-auth-token', dummyToken);

        expect(res.statusCode).toEqual(400);
        expect(res.body.msg).toBe('Cannot delete model: It has associated repairs');
        expect(pool.query).not.toHaveBeenCalledWith('DELETE FROM vfd.vfds WHERE model_id = $1', ['1']);
    });
});
