const express = require('express');
const request = require('supertest');
const { createLimiter } = require('../../src/middleware/rateLimiter');
const errorHandler = require('../../src/middleware/errorHandler');

describe('rate limiter', () => {
  const buildApp = () => {
    const app = express();
    app.use(createLimiter({ windowMs: 60_000, limit: 2, message: 'Slow down' }));
    app.get('/', (_req, res) => res.json({ ok: true }));
    app.use(errorHandler);
    return app;
  };

  it('returns 429 with the standard error shape once the limit is exceeded', async () => {
    const app = buildApp();
    await request(app).get('/').expect(200);
    await request(app).get('/').expect(200);
    const res = await request(app).get('/').expect(429);
    expect(res.body).toEqual({ success: false, message: 'Slow down' });
  });
});
