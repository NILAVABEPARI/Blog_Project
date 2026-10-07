const Post = require('../../src/models/Post');
const { generateUniqueSlug } = require('../../src/services/post.service');

jest.mock('../../src/models/Post');

describe('generateUniqueSlug', () => {
  beforeEach(() => jest.resetAllMocks());

  it('creates a URL-friendly slug', async () => {
    Post.exists.mockResolvedValue(null);
    expect(await generateUniqueSlug('Hello, World! Node.js & Express?')).toBe('hello-world-nodejs-and-express');
  });

  it('appends a random suffix when the slug is taken', async () => {
    Post.exists.mockResolvedValueOnce({ _id: 1 }).mockResolvedValueOnce(null);
    expect(await generateUniqueSlug('My Post')).toMatch(/^my-post-[0-9a-f]{6}$/);
  });

  it('falls back to a default for titles with no usable characters', async () => {
    Post.exists.mockResolvedValue(null);
    expect(await generateUniqueSlug('!!!')).toBe('post');
  });
});
