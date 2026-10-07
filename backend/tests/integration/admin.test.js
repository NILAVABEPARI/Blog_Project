const request = require('supertest');
const app = require('../../src/app');
const db = require('../helpers/db');
const { createUser, createPost, bearer, waitFor } = require('../helpers/factories');
const { Comment, Post, User, RefreshToken, ActivityLog } = require('../../src/models');

const API = '/api/v1/admin';

beforeAll(db.connect);
afterEach(db.clear);
afterAll(db.disconnect);

describe('admin access control (enforced by the API, not the UI)', () => {
  const endpoints = [
    ['get', '/stats'],
    ['get', '/users'],
    ['get', '/posts'],
    ['get', '/comments'],
    ['get', '/activity-logs'],
  ];

  it.each(endpoints)('%s %s -> 401 without a token', async (method, path) => {
    await request(app)[method](`${API}${path}`).expect(401);
  });

  it.each(endpoints)('%s %s -> 403 for a regular user', async (method, path) => {
    const { token } = await createUser();
    await request(app)[method](`${API}${path}`).set(bearer(token)).expect(403);
  });

  it('a regular user cannot promote themselves', async () => {
    const { user, token } = await createUser();
    await request(app).patch(`${API}/users/${user._id}`).set(bearer(token)).send({ role: 'admin' }).expect(403);
    expect((await User.findById(user._id)).role).toBe('user');
  });
});

describe('GET /admin/stats', () => {
  it('returns total users, posts and comments', async () => {
    const admin = await createUser({ role: 'admin' });
    const user = await createUser();
    const post = await createPost(user.user._id);
    await createPost(user.user._id, { isDeleted: true });
    await Comment.create({ post: post._id, author: user.user._id, content: 'hi' });

    const res = await request(app).get(`${API}/stats`).set(bearer(admin.token)).expect(200);
    expect(res.body.data.stats).toEqual({ users: 2, posts: 1, comments: 1, deletedPosts: 1 });
  });
});

describe('user management', () => {
  it('lists users with pagination, search and role filter', async () => {
    const admin = await createUser({ role: 'admin' });
    await createUser({ name: 'Zelda Searchable' });
    await createUser();

    const all = await request(app).get(`${API}/users?limit=2`).set(bearer(admin.token)).expect(200);
    expect(all.body.data.users).toHaveLength(2);
    expect(all.body.meta.total).toBe(3);
    expect(all.body.data.users[0].password).toBeUndefined();

    const search = await request(app).get(`${API}/users?search=zelda`).set(bearer(admin.token)).expect(200);
    expect(search.body.data.users).toHaveLength(1);

    const admins = await request(app).get(`${API}/users?role=admin`).set(bearer(admin.token)).expect(200);
    expect(admins.body.meta.total).toBe(1);
  });

  it('updates role and deactivates a user, revoking their sessions', async () => {
    const admin = await createUser({ role: 'admin' });
    const target = await createUser();
    await RefreshToken.create({ user: target.user._id, tokenHash: 'abc', expiresAt: new Date(Date.now() + 1e6) });

    const promoted = await request(app).patch(`${API}/users/${target.user._id}`).set(bearer(admin.token)).send({ role: 'admin' }).expect(200);
    expect(promoted.body.data.user.role).toBe('admin');

    await request(app).patch(`${API}/users/${target.user._id}`).set(bearer(admin.token)).send({ isActive: false }).expect(200);
    expect(await RefreshToken.countDocuments({ user: target.user._id, revokedAt: null })).toBe(0);
    await request(app).get('/api/v1/auth/me').set(bearer(target.token)).expect(401);
  });

  it('prevents an admin from demoting, deactivating or deleting themselves', async () => {
    const admin = await createUser({ role: 'admin' });
    await request(app).patch(`${API}/users/${admin.user._id}`).set(bearer(admin.token)).send({ role: 'user' }).expect(400);
    await request(app).patch(`${API}/users/${admin.user._id}`).set(bearer(admin.token)).send({ isActive: false }).expect(400);
    await request(app).delete(`${API}/users/${admin.user._id}`).set(bearer(admin.token)).expect(400);
  });

  it('rejects invalid role values', async () => {
    const admin = await createUser({ role: 'admin' });
    const target = await createUser();
    await request(app).patch(`${API}/users/${target.user._id}`).set(bearer(admin.token)).send({ role: 'superuser' }).expect(422);
  });

  it('deleting a user soft-deletes their posts and removes their comments', async () => {
    const admin = await createUser({ role: 'admin' });
    const target = await createUser();
    const post = await createPost(target.user._id);
    await Comment.create({ post: post._id, author: target.user._id, content: 'bye' });

    await request(app).delete(`${API}/users/${target.user._id}`).set(bearer(admin.token)).expect(200);

    expect(await User.findById(target.user._id)).toBeNull();
    expect((await Post.findById(post._id)).isDeleted).toBe(true);
    expect(await Comment.countDocuments()).toBe(0);
  });
});

describe('post management', () => {
  it('lists deleted posts, restores them, and can purge permanently', async () => {
    const admin = await createUser({ role: 'admin' });
    const { user } = await createUser();
    const deleted = await createPost(user._id, { isDeleted: true, deletedAt: new Date() });
    await createPost(user._id);
    await Comment.create({ post: deleted._id, author: user._id, content: 'orphan soon' });

    const list = await request(app).get(`${API}/posts?status=deleted`).set(bearer(admin.token)).expect(200);
    expect(list.body.data.posts).toHaveLength(1);

    const restored = await request(app).patch(`${API}/posts/${deleted._id}/restore`).set(bearer(admin.token)).expect(200);
    expect(restored.body.data.post.isDeleted).toBe(false);
    await request(app).patch(`${API}/posts/${deleted._id}/restore`).set(bearer(admin.token)).expect(404); // no longer deleted

    await request(app).delete(`${API}/posts/${deleted._id}/permanent`).set(bearer(admin.token)).expect(200);
    expect(await Post.findById(deleted._id)).toBeNull();
    expect(await Comment.countDocuments()).toBe(0);
  });
});

describe('activity logs', () => {
  it('records post creation and exposes it to admins', async () => {
    const admin = await createUser({ role: 'admin' });
    const { token } = await createUser();

    await request(app).post('/api/v1/posts').set(bearer(token)).send({ title: 'Audited post', content: 'Content that is long enough.' }).expect(201);
    await waitFor(() => ActivityLog.findOne({ action: 'POST_CREATED' }));

    const res = await request(app).get(`${API}/activity-logs?action=POST_CREATED`).set(bearer(admin.token)).expect(200);
    expect(res.body.data.logs).toHaveLength(1);
    expect(res.body.data.logs[0].user.email).toBeDefined();
  });

  it('does not log failed requests', async () => {
    const { token } = await createUser();
    await request(app).post('/api/v1/posts').set(bearer(token)).send({ title: 'x' }).expect(422);
    await new Promise((r) => setTimeout(r, 150));
    expect(await ActivityLog.countDocuments({ action: 'POST_CREATED' })).toBe(0);
  });
});
