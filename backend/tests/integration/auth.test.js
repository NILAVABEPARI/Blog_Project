const request = require('supertest');
const app = require('../../src/app');
const db = require('../helpers/db');
const { createUser, bearer, waitFor } = require('../helpers/factories');
const { ActivityLog, RefreshToken, User } = require('../../src/models');

const API = '/api/v1/auth';
const valid = { name: 'Ada Lovelace', email: 'ada@example.com', password: 'Password123' };
const cookieOf = (res) => res.headers['set-cookie'].find((c) => c.startsWith('refreshToken=')).split(';')[0];

beforeAll(db.connect);
afterEach(db.clear);
afterAll(db.disconnect);

describe('POST /auth/register', () => {
  it('creates a user, returns an access token and sets an httpOnly refresh cookie', async () => {
    const res = await request(app).post(`${API}/register`).send(valid).expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toEqual(expect.any(String));
    expect(res.body.data.user).toMatchObject({ email: valid.email, role: 'user' });
    expect(res.body.data.user.password).toBeUndefined();

    const cookie = res.headers['set-cookie'].find((c) => c.startsWith('refreshToken='));
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/Path=\/api\/v1\/auth/);
  });

  it('stores a bcrypt hash, never the plain password', async () => {
    await request(app).post(`${API}/register`).send(valid).expect(201);
    const user = await User.findOne({ email: valid.email }).select('+password');
    expect(user.password).not.toBe(valid.password);
    expect(user.password).toMatch(/^\$2[aby]\$/);
  });

  it('ignores a role sent by the client (no privilege escalation)', async () => {
    const res = await request(app).post(`${API}/register`).send({ ...valid, role: 'admin' }).expect(201);
    expect(res.body.data.user.role).toBe('user');
  });

  it('rejects duplicate emails with 409', async () => {
    await request(app).post(`${API}/register`).send(valid).expect(201);
    await request(app).post(`${API}/register`).send(valid).expect(409);
  });

  it('rejects weak passwords with 422 and field errors', async () => {
    const res = await request(app).post(`${API}/register`).send({ ...valid, password: 'weak' }).expect(422);
    expect(res.body.success).toBe(false);
    expect(res.body.errors.some((e) => e.field === 'password')).toBe(true);
  });
});

describe('POST /auth/login', () => {
  beforeEach(() => createUser({ email: valid.email, password: valid.password }));

  it('logs in with correct credentials', async () => {
    const res = await request(app).post(`${API}/login`).send({ email: valid.email, password: valid.password }).expect(200);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('returns the same 401 for a wrong password and an unknown email', async () => {
    const wrongPw = await request(app).post(`${API}/login`).send({ email: valid.email, password: 'Wrong123' }).expect(401);
    const unknown = await request(app).post(`${API}/login`).send({ email: 'nobody@example.com', password: 'Wrong123' }).expect(401);
    expect(wrongPw.body.message).toBe(unknown.body.message);
  });

  it('blocks deactivated accounts', async () => {
    await User.updateOne({ email: valid.email }, { isActive: false });
    await request(app).post(`${API}/login`).send({ email: valid.email, password: valid.password }).expect(403);
  });

  it('records a USER_LOGIN activity entry', async () => {
    await request(app).post(`${API}/login`).send({ email: valid.email, password: valid.password }).expect(200);
    const log = await waitFor(() => ActivityLog.findOne({ action: 'USER_LOGIN' }));
    expect(log.user).toBeDefined();
  });
});

describe('GET /auth/me', () => {
  it('requires a token', async () => {
    await request(app).get(`${API}/me`).expect(401);
  });

  it('returns the current user', async () => {
    const { user, token } = await createUser();
    const res = await request(app).get(`${API}/me`).set(bearer(token)).expect(200);
    expect(res.body.data.user.email).toBe(user.email);
  });

  it('stops working as soon as the user is deactivated', async () => {
    const { user, token } = await createUser();
    await User.updateOne({ _id: user._id }, { isActive: false });
    await request(app).get(`${API}/me`).set(bearer(token)).expect(401);
  });
});

describe('refresh token rotation', () => {
  it('issues a new access token and rotates the refresh token', async () => {
    const login = await request(app).post(`${API}/register`).send(valid).expect(201);
    const first = cookieOf(login);

    const refreshed = await request(app).post(`${API}/refresh`).set('Cookie', first).expect(200);
    expect(refreshed.body.data.accessToken).toBeDefined();
    expect(cookieOf(refreshed)).not.toBe(first);
  });

  it('rejects a missing cookie', async () => {
    await request(app).post(`${API}/refresh`).expect(401);
  });

  it('detects reuse of an old refresh token and revokes the whole session family', async () => {
    const login = await request(app).post(`${API}/register`).send(valid).expect(201);
    const first = cookieOf(login);

    const second = await request(app).post(`${API}/refresh`).set('Cookie', first).expect(200);
    await request(app).post(`${API}/refresh`).set('Cookie', first).expect(401); // replay of the used token

    // the legitimately rotated token is now revoked as well
    await request(app).post(`${API}/refresh`).set('Cookie', cookieOf(second)).expect(401);
    expect(await RefreshToken.countDocuments({ revokedAt: null })).toBe(0);
  });
});

describe('POST /auth/logout', () => {
  it('revokes the refresh token', async () => {
    const login = await request(app).post(`${API}/register`).send(valid).expect(201);
    const cookie = cookieOf(login);

    await request(app).post(`${API}/logout`).set('Cookie', cookie).expect(200);
    await request(app).post(`${API}/refresh`).set('Cookie', cookie).expect(401);
  });
});

describe('OAuth routes', () => {
  it('return 501 when a provider is not configured', async () => {
    const res = await request(app).get(`${API}/google`).expect(501);
    expect(res.body.success).toBe(false);
  });
});
