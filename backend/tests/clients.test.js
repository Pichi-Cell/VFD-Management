import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

const secret = 'test-secret';
process.env.JWT_SECRET = secret;
const dummyToken = jwt.sign({ id: 1, username: 'tester' }, secret);

describe('Clients Controller', () => {
    let app;
    const pool = globalThis.mockPool;

    beforeEach(async () => {
        vi.clearAllMocks();
        const clientRoutes = (await import('../routes/clients')).default;
        app = express();
        app.use(express.json());
        app.use('/api/clients', clientRoutes);
    });

    it('should fetch all clients', async () => {
        pool.query.mockResolvedValueOnce({ rows: [{ id: 1, name: 'Client A' }] });

        const res = await request(app)
            .get('/api/clients')
            .set('x-auth-token', dummyToken);

        expect(res.statusCode).toEqual(200);
        expect(res.body[0].name).toBe('Client A');
    });

    it('should delete orphan VFDs before deleting a client with no repairs', async () => {
        pool.query
            .mockResolvedValueOnce({}) // BEGIN
            .mockResolvedValueOnce({ rows: [] }) // repair check
            .mockResolvedValueOnce({}) // delete orphan VFDs
            .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // delete client
            .mockResolvedValueOnce({}); // COMMIT

        const res = await request(app)
            .delete('/api/clients/1')
            .set('x-auth-token', dummyToken);

        expect(res.statusCode).toEqual(200);
        expect(res.body.msg).toBe('Client removed');
        expect(pool.query).toHaveBeenCalledWith('DELETE FROM vfd.vfds WHERE client_id = $1', ['1']);
    });

    it('should block client deletion while repairs still exist', async () => {
        pool.query
            .mockResolvedValueOnce({}) // BEGIN
            .mockResolvedValueOnce({ rows: [{ '?column?': 1 }] }) // repair check
            .mockResolvedValueOnce({}); // ROLLBACK

        const res = await request(app)
            .delete('/api/clients/1')
            .set('x-auth-token', dummyToken);

        expect(res.statusCode).toEqual(400);
        expect(res.body.msg).toBe('Cannot delete client: It has associated repairs');
        expect(pool.query).not.toHaveBeenCalledWith('DELETE FROM vfd.vfds WHERE client_id = $1', ['1']);
    });
});
