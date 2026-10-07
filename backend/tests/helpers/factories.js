const { User, Post } = require('../../src/models');
const { signAccessToken } = require('../../src/utils/token');

let counter = 0;

exports.createUser = async (overrides = {}) => {
  counter += 1;
  const user = await User.create({
    name: `Test User ${counter}`,
    email: `user${counter}@example.com`,
    password: 'Password123',
    ...overrides,
  });
  return { user, token: signAccessToken(user) };
};

exports.createPost = (authorId, overrides = {}) => {
  counter += 1;
  return Post.create({
    title: `Sample post ${counter}`,
    slug: `sample-post-${counter}`,
    content: 'This is some sample post content for tests.',
    author: authorId,
    ...overrides,
  });
};

exports.bearer = (token) => ({ Authorization: `Bearer ${token}` });

exports.waitFor = async (fn, { timeout = 2000, interval = 50 } = {}) => {
  const start = Date.now();
  for (;;) {
    const result = await fn();
    if (result) return result;
    if (Date.now() - start > timeout) throw new Error('waitFor timed out');
    await new Promise((r) => setTimeout(r, interval));
  }
};
