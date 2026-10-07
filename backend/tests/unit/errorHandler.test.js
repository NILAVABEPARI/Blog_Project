const { z } = require('zod');
const errorHandler = require('../../src/middleware/errorHandler');
const ApiError = require('../../src/utils/ApiError');

const handle = (err) => {
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  errorHandler(err, {}, res, jest.fn());
  return { status: res.status.mock.calls[0][0], body: res.json.mock.calls[0][0] };
};

describe('errorHandler', () => {
  it('formats ApiError consistently', () => {
    const { status, body } = handle(ApiError.forbidden('Nope'));
    expect(status).toBe(403);
    expect(body).toEqual({ success: false, message: 'Nope' });
  });

  it('turns Zod errors into 422 with field details', () => {
    const result = z.object({ email: z.string() }).safeParse({});
    const { status, body } = handle(result.error);
    expect(status).toBe(422);
    expect(body.errors[0].field).toBe('email');
  });

  it('maps duplicate key errors to 409', () => {
    const { status, body } = handle({ code: 11000, keyValue: { email: 'a@b.co' } });
    expect(status).toBe(409);
    expect(body.message).toMatch(/email/);
  });

  it('maps CastError to 400', () => {
    expect(handle({ name: 'CastError', path: '_id' }).status).toBe(400);
  });

  it('maps JWT errors to 401', () => {
    expect(handle({ name: 'JsonWebTokenError' }).status).toBe(401);
  });

  it('hides internals for unexpected errors', () => {
    const { status, body } = handle(new Error('db password is hunter2'));
    expect(status).toBe(500);
    expect(body.message).toBe('Internal server error');
  });
});
