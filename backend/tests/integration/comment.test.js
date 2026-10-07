const request = require('supertest');
const app = require('../../src/app');
const db = require('../helpers/db');
const { createUser, createPost, bearer } = require('../helpers/factories');
const { Comment } = require('../../src/models');

beforeAll(db.connect);
afterEach(db.clear);
afterAll(db.disconnect);

const setup = async () => {
  const author = await createUser();
  const commenter = await createUser();
  const post = await createPost(author.user._id);
  return { author, commenter, post };
};

describe('comments', () => {
  it('requires authentication to comment but not to read', async () => {
    const { post } = await setup();
    await request(app).post(`/api/v1/posts/${post._id}/comments`).send({ content: 'hi' }).expect(401);
    await request(app).get(`/api/v1/posts/${post._id}/comments`).expect(200);
  });

  it('creates and lists comments for a post (paginated, populated author)', async () => {
    const { commenter, post } = await setup();
    const url = `/api/v1/posts/${post._id}/comments`;

    const created = await request(app).post(url).set(bearer(commenter.token)).send({ content: 'Nice post!' }).expect(201);
    expect(created.body.data.comment.author.name).toBe(commenter.user.name);

    const list = await request(app).get(`${url}?limit=1`).expect(200);
    expect(list.body.data.comments).toHaveLength(1);
    expect(list.body.meta.total).toBe(1);
  });

  it('returns 404 when commenting on a missing or soft-deleted post', async () => {
    const { author, commenter } = await setup();
    const deleted = await createPost(author.user._id, { isDeleted: true });
    await request(app).post(`/api/v1/posts/${deleted._id}/comments`).set(bearer(commenter.token)).send({ content: 'hello' }).expect(404);
  });

  it('validates comment content', async () => {
    const { commenter, post } = await setup();
    await request(app).post(`/api/v1/posts/${post._id}/comments`).set(bearer(commenter.token)).send({ content: '   ' }).expect(422);
  });

  it('lets only the author edit a comment (and marks it edited)', async () => {
    const { author, commenter, post } = await setup();
    const comment = await Comment.create({ post: post._id, author: commenter.user._id, content: 'original' });

    await request(app).patch(`/api/v1/comments/${comment._id}`).set(bearer(author.token)).send({ content: 'hijack' }).expect(403);

    const res = await request(app).patch(`/api/v1/comments/${comment._id}`).set(bearer(commenter.token)).send({ content: 'updated' }).expect(200);
    expect(res.body.data.comment).toMatchObject({ content: 'updated', isEdited: true });
  });

  it("forbids deleting another user's comment but allows the author and admins", async () => {
    const { author, commenter, post } = await setup();
    const admin = await createUser({ role: 'admin' });
    const make = () => Comment.create({ post: post._id, author: commenter.user._id, content: 'x' });

    const c1 = await make();
    await request(app).delete(`/api/v1/comments/${c1._id}`).set(bearer(author.token)).expect(403);
    await request(app).delete(`/api/v1/comments/${c1._id}`).set(bearer(commenter.token)).expect(200);

    const c2 = await make();
    await request(app).delete(`/api/v1/comments/${c2._id}`).set(bearer(admin.token)).expect(200);
    expect(await Comment.countDocuments()).toBe(0);
  });

  it('returns 404 for an unknown comment', async () => {
    const { commenter } = await setup();
    await request(app).delete('/api/v1/comments/507f1f77bcf86cd799439011').set(bearer(commenter.token)).expect(404);
  });
});
