import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

const secret = 'test-secret';
process.env.JWT_SECRET = secret;
const dummyToken = jwt.sign({ id: 1, username: 'tester' }, secret);

describe('Stress Tests', () => {
    let app;
    const pool = globalThis.mockPool;

    beforeEach(async () => {
        vi.clearAllMocks();
        const repairRoutes = (await import('../routes/repairs')).default;
        const imageRoutes = (await import('../routes/images')).default;
        app = express();
        app.use(express.json());
        app.use('/api/repairs', repairRoutes);
        app.use('/api/images', imageRoutes);
    });

    it('should handle 50 concurrent repair creations', async () => {
        pool.query.mockImplementation(() => Promise.resolve({
            rows: [{ id: 1, vfd_id: 1, type: 'Quote' }]
        }));

        const requests = Array.from({ length: 50 }, () =>
            request(app)
                .post('/api/repairs')
                .set('x-auth-token', dummyToken)
                .send({ vfd_id: 1, type: 'Quote' })
        );

        const responses = await Promise.all(requests);
        responses.forEach(res => expect(res.statusCode).toEqual(200));
        expect(pool.query).toHaveBeenCalledTimes(50);
    });
});
