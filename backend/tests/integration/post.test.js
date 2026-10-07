const request = require('supertest');
const app = require('../../src/app');
const db = require('../helpers/db');
const { createUser, createPost, bearer } = require('../helpers/factories');
const { Post } = require('../../src/models');

const API = '/api/v1/posts';
const payload = { title: 'My First Post!', content: 'Some meaningful content for the post.' };

beforeAll(db.connect);
afterEach(db.clear);
afterAll(db.disconnect);

describe('POST /posts', () => {
  it('requires authentication', async () => {
    await request(app).post(API).send(payload).expect(401);
  });

  it('creates a post with author, timestamps and a slug', async () => {
    const { user, token } = await createUser();
    const res = await request(app).post(API).set(bearer(token)).send(payload).expect(201);

    const { post } = res.body.data;
    expect(post.slug).toBe('my-first-post');
    expect(post.author).toMatchObject({ _id: String(user._id), name: user.name });
    expect(post.createdAt).toBeDefined();
    expect(post.updatedAt).toBeDefined();
  });

  it('generates a unique slug when the title repeats', async () => {
    const { token } = await createUser();
    const a = await request(app).post(API).set(bearer(token)).send(payload).expect(201);
    const b = await request(app).post(API).set(bearer(token)).send(payload).expect(201);
    expect(a.body.data.post.slug).not.toBe(b.body.data.post.slug);
    expect(b.body.data.post.slug).toMatch(/^my-first-post-[0-9a-f]{6}$/);
  });

  it('validates the payload', async () => {
    const { token } = await createUser();
    const res = await request(app).post(API).set(bearer(token)).send({ title: 'x' }).expect(422);
    expect(res.body.errors.map((e) => e.field)).toEqual(expect.arrayContaining(['title', 'content']));
  });
});

describe('GET /posts', () => {
  it('is public, paginated, and excludes soft-deleted posts', async () => {
    const { user } = await createUser();
    for (let i = 0; i < 5; i += 1) await createPost(user._id);
    await createPost(user._id, { isDeleted: true });

    const res = await request(app).get(`${API}?page=2&limit=2`).expect(200);
    expect(res.body.data.posts).toHaveLength(2);
    expect(res.body.meta).toMatchObject({ page: 2, limit: 2, total: 5, totalPages: 3, hasNextPage: true, hasPrevPage: true });
    expect(res.body.data.posts[0].content).toBeUndefined(); // list uses excerpt only
    expect(res.body.data.posts[0].excerpt).toBeDefined();
  });

  // $text needs a real MongoDB text index; set TEST_SKIP_TEXT_SEARCH=1 on servers that lack it
  const itText = process.env.TEST_SKIP_TEXT_SEARCH ? it.skip : it;
  itText('supports text search', async () => {
    const { user } = await createUser();
    await createPost(user._id, { title: 'Learning Express middleware' });
    await createPost(user._id, { title: 'Gardening tips for spring' });
    const res = await request(app).get(`${API}?search=express`).expect(200);
    expect(res.body.data.posts).toHaveLength(1);
  });

  it('rejects an out-of-range limit', async () => {
    await request(app).get(`${API}?limit=1000`).expect(422);
  });
});

describe('GET /posts/:idOrSlug', () => {
  it('finds a post by slug and by id', async () => {
    const { user } = await createUser();
    const post = await createPost(user._id, { title: 'Findable', slug: 'findable' });
    await request(app).get(`${API}/findable`).expect(200);
    const res = await request(app).get(`${API}/${post._id}`).expect(200);
    expect(res.body.data.post.content).toBeDefined();
  });

  it('returns 404 for unknown or soft-deleted posts', async () => {
    const { user } = await createUser();
    await createPost(user._id, { slug: 'gone', isDeleted: true });
    await request(app).get(`${API}/gone`).expect(404);
    await request(app).get(`${API}/does-not-exist`).expect(404);
  });
});

describe('PATCH/DELETE /posts/:id (ownership + RBAC)', () => {
  it('lets the owner edit, keeping the slug stable', async () => {
    const { user, token } = await createUser();
    const post = await createPost(user._id, { slug: 'stable-slug' });
    const res = await request(app).patch(`${API}/${post._id}`).set(bearer(token)).send({ title: 'Brand new title' }).expect(200);
    expect(res.body.data.post.title).toBe('Brand new title');
    expect(res.body.data.post.slug).toBe('stable-slug');
  });

  it("forbids editing or deleting someone else's post", async () => {
    const owner = await createUser();
    const other = await createUser();
    const post = await createPost(owner.user._id);

    await request(app).patch(`${API}/${post._id}`).set(bearer(other.token)).send({ title: 'Hijacked' }).expect(403);
    await request(app).delete(`${API}/${post._id}`).set(bearer(other.token)).expect(403);
  });

  it('lets an admin edit and delete any post', async () => {
    const owner = await createUser();
    const admin = await createUser({ role: 'admin' });
    const post = await createPost(owner.user._id);

    await request(app).patch(`${API}/${post._id}`).set(bearer(admin.token)).send({ title: 'Edited by admin' }).expect(200);
    await request(app).delete(`${API}/${post._id}`).set(bearer(admin.token)).expect(200);
  });

  it('soft-deletes: the document stays in MongoDB but disappears from the API', async () => {
    const { user, token } = await createUser();
    const post = await createPost(user._id, { slug: 'to-delete' });

    await request(app).delete(`${API}/${post._id}`).set(bearer(token)).expect(200);

    const inDb = await Post.findById(post._id);
    expect(inDb.isDeleted).toBe(true);
    expect(inDb.deletedAt).toBeInstanceOf(Date);
    await request(app).get(`${API}/to-delete`).expect(404);
    await request(app).delete(`${API}/${post._id}`).set(bearer(token)).expect(404); // already deleted
  });

  it('returns 422 for a malformed id', async () => {
    const { token } = await createUser();
    await request(app).delete(`${API}/not-an-id`).set(bearer(token)).expect(422);
  });
});
