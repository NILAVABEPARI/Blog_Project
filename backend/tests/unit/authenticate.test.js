const jwt = require('jsonwebtoken');
const authenticate = require('../../src/middleware/authenticate');
const User = require('../../src/models/User');
const { signAccessToken } = require('../../src/utils/token');

jest.mock('../../src/models/User');

const run = async (headers) => {
  const req = { headers };
  const next = jest.fn();
  await authenticate(req, {}, next);
  return { req, error: next.mock.calls[0][0] };
};

const fakeUser = { id: 'u1', role: 'user', isActive: true };

describe('authenticate middleware', () => {
  beforeEach(() => jest.resetAllMocks());

  it('rejects a missing Authorization header', async () => {
    expect((await run({})).error.statusCode).toBe(401);
  });

  it('rejects a malformed token', async () => {
    const { error } = await run({ authorization: 'Bearer not-a-jwt' });
    expect(error.statusCode).toBe(401);
    expect(error.message).toMatch(/invalid/i);
  });

  it('reports an expired token', async () => {
    const expired = jwt.sign({ sub: 'u1' }, process.env.JWT_ACCESS_SECRET, { expiresIn: -10 });
    const { error } = await run({ authorization: `Bearer ${expired}` });
    expect(error.message).toMatch(/expired/i);
  });

  it('rejects a token signed with the wrong secret', async () => {
    const forged = jwt.sign({ sub: 'u1' }, 'another-secret-another-secret');
    expect((await run({ authorization: `Bearer ${forged}` })).error.statusCode).toBe(401);
  });

  it('rejects when the user no longer exists', async () => {
    User.findById.mockResolvedValue(null);
    const { error } = await run({ authorization: `Bearer ${signAccessToken(fakeUser)}` });
    expect(error.statusCode).toBe(401);
  });

  it('rejects a deactivated user', async () => {
    User.findById.mockResolvedValue({ ...fakeUser, isActive: false });
    const { error } = await run({ authorization: `Bearer ${signAccessToken(fakeUser)}` });
    expect(error.statusCode).toBe(401);
  });

  it('attaches req.user for a valid token', async () => {
    User.findById.mockResolvedValue(fakeUser);
    const { req, error } = await run({ authorization: `Bearer ${signAccessToken(fakeUser)}` });
    expect(error).toBeUndefined();
    expect(req.user).toBe(fakeUser);
  });
});
