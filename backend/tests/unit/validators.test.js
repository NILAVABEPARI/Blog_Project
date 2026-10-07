const { registerSchema } = require('../../src/validators/auth.validator');
const { createPostSchema, updatePostSchema, listPostsQuery } = require('../../src/validators/post.validator');
const { updateUserSchema } = require('../../src/validators/admin.validator');
const { idParam } = require('../../src/validators/common.validator');

describe('auth validators', () => {
  it('normalizes email and trims name', () => {
    const data = registerSchema.parse({ name: '  Ada  ', email: '  ADA@Example.COM ', password: 'Password1' });
    expect(data).toEqual({ name: 'Ada', email: 'ada@example.com', password: 'Password1' });
  });

  it.each(['short1A', 'alllowercase1', 'ALLUPPERCASE1', 'NoNumbersHere'])('rejects weak password %s', (password) => {
    expect(registerSchema.safeParse({ name: 'Ada', email: 'a@b.co', password }).success).toBe(false);
  });

  it('strips unknown fields such as role (mass-assignment protection)', () => {
    const data = registerSchema.parse({ name: 'Ada', email: 'a@b.co', password: 'Password1', role: 'admin' });
    expect(data.role).toBeUndefined();
  });
});

describe('post validators', () => {
  it('requires a title and content of minimum length', () => {
    expect(createPostSchema.safeParse({ title: 'ab', content: 'short' }).success).toBe(false);
    expect(createPostSchema.safeParse({ title: 'Valid title', content: 'Valid content here' }).success).toBe(true);
  });

  it('requires at least one field on update', () => {
    expect(updatePostSchema.safeParse({}).success).toBe(false);
    expect(updatePostSchema.safeParse({ title: 'New title' }).success).toBe(true);
  });

  it('applies pagination defaults and coerces strings', () => {
    expect(listPostsQuery.parse({})).toMatchObject({ page: 1, limit: 10, sort: 'newest' });
    expect(listPostsQuery.parse({ page: '2', limit: '5' })).toMatchObject({ page: 2, limit: 5 });
  });

  it('caps the page size', () => {
    expect(listPostsQuery.safeParse({ limit: '500' }).success).toBe(false);
  });
});

describe('admin and common validators', () => {
  it('only accepts known roles', () => {
    expect(updateUserSchema.safeParse({ role: 'superuser' }).success).toBe(false);
    expect(updateUserSchema.safeParse({ role: 'admin' }).success).toBe(true);
  });

  it('rejects malformed ObjectIds', () => {
    expect(idParam.safeParse({ id: '123' }).success).toBe(false);
    expect(idParam.safeParse({ id: '507f1f77bcf86cd799439011' }).success).toBe(true);
  });
});
