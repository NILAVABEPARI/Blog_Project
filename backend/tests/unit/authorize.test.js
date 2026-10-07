const { authorize, authorizeOwnerOrAdmin } = require('../../src/middleware/authorize');

const run = async (mw, req) => {
  const next = jest.fn();
  await mw(req, {}, next);
  return next.mock.calls[0][0];
};

describe('authorize (RBAC)', () => {
  it('rejects unauthenticated requests with 401', async () => {
    const err = await run(authorize('admin'), {});
    expect(err.statusCode).toBe(401);
  });

  it('rejects a role that is not allowed with 403', async () => {
    const err = await run(authorize('admin'), { user: { role: 'user' } });
    expect(err.statusCode).toBe(403);
  });

  it('lets an allowed role through', async () => {
    const err = await run(authorize('admin', 'user'), { user: { role: 'user' } });
    expect(err).toBeUndefined();
  });
});

describe('authorizeOwnerOrAdmin', () => {
  const post = { author: 'owner-id' };
  const mw = authorizeOwnerOrAdmin({ loader: async () => post, resourceKey: 'post' });

  it('allows the owner and attaches the resource', async () => {
    const req = { user: { _id: 'owner-id', role: 'user' } };
    expect(await run(mw, req)).toBeUndefined();
    expect(req.post).toBe(post);
  });

  it('allows an admin who is not the owner', async () => {
    expect(await run(mw, { user: { _id: 'someone', role: 'admin' } })).toBeUndefined();
  });

  it('forbids a different regular user', async () => {
    const err = await run(mw, { user: { _id: 'someone', role: 'user' } });
    expect(err.statusCode).toBe(403);
  });

  it('returns 404 when the resource does not exist', async () => {
    const missing = authorizeOwnerOrAdmin({ loader: async () => null });
    const err = await run(missing, { user: { _id: 'x', role: 'admin' } });
    expect(err.statusCode).toBe(404);
  });

  it('handles a populated owner object', async () => {
    const populated = authorizeOwnerOrAdmin({ loader: async () => ({ author: { _id: 'owner-id' } }) });
    expect(await run(populated, { user: { _id: 'owner-id', role: 'user' } })).toBeUndefined();
  });
});
