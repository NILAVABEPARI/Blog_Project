const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const ApiError = require('../utils/ApiError');
const {
  signAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
} = require('../utils/token');

const issueTokens = async (user, meta = {}) => {
  const accessToken = signAccessToken(user);
  const { token: refreshToken, expiresAt } = generateRefreshToken(user._id);

  await RefreshToken.create({
    user: user._id,
    tokenHash: hashToken(refreshToken),
    expiresAt,
    ip: meta.ip,
    userAgent: meta.userAgent,
  });

  return { accessToken, refreshToken, refreshExpiresAt: expiresAt };
};

const revokeAllForUser = (userId) =>
  RefreshToken.updateMany({ user: userId, revokedAt: null }, { revokedAt: new Date() });

const register = async ({ name, email, password }, meta) => {
  if (await User.exists({ email })) throw ApiError.conflict('Email is already registered');

  // Role is never taken from the request: public registration always creates a regular user
  const user = await User.create({ name, email, password });
  return { user, ...(await issueTokens(user, meta)) };
};

const login = async ({ email, password }, meta) => {
  const user = await User.findOne({ email }).select('+password');

  // Same message for unknown email / wrong password / social-only account: no user enumeration
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  if (!user.isActive) throw ApiError.forbidden('This account has been deactivated');

  await User.updateOne({ _id: user._id }, { lastLoginAt: new Date() });
  return { user, ...(await issueTokens(user, meta)) };
};

/**
 * Refresh-token rotation: each refresh token can be used exactly once.
 * Presenting an already-used token is treated as theft and revokes every session of that user.
 */
const refresh = async (refreshToken, meta) => {
  if (!refreshToken) throw ApiError.unauthorized('Refresh token missing');

  try {
    verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const tokenHash = hashToken(refreshToken);
  const now = new Date();

  // Atomic "claim": only one concurrent request can win
  const stored = await RefreshToken.findOneAndUpdate(
    { tokenHash, revokedAt: null, expiresAt: { $gt: now } },
    { revokedAt: now }
  );

  if (!stored) {
    const reused = await RefreshToken.findOne({ tokenHash });
    if (reused) await revokeAllForUser(reused.user);
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const user = await User.findById(stored.user);
  if (!user || !user.isActive) throw ApiError.unauthorized('User no longer exists or has been deactivated');

  return { user, ...(await issueTokens(user, meta)) };
};

/** Returns the id of the user whose session was closed (or null if the token was unknown). */
const logout = async (refreshToken) => {
  if (!refreshToken) return null;
  const stored = await RefreshToken.findOneAndUpdate(
    { tokenHash: hashToken(refreshToken), revokedAt: null },
    { revokedAt: new Date() }
  );
  return stored ? stored.user : null;
};

/**
 * Called by the Google/Facebook passport strategies.
 * 1. Known provider id  -> log in
 * 2. Known email        -> link the provider to the existing account
 * 3. Otherwise          -> create a new regular user (no password)
 */
const findOrCreateSocialUser = async ({ provider, providerId, email, name, avatar }) => {
  const idField = `${provider}Id`;

  let user = await User.findOne({ [idField]: providerId });

  if (!user) {
    if (!email) throw ApiError.badRequest(`Your ${provider} account did not share an email address`);

    user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      user[idField] = providerId;
      if (!user.avatar && avatar) user.avatar = avatar;
      await user.save();
    } else {
      user = await User.create({
        name: (name || email.split('@')[0]).slice(0, 50),
        email,
        avatar,
        [idField]: providerId,
      });
    }
  }

  if (!user.isActive) throw ApiError.forbidden('This account has been deactivated');
  await User.updateOne({ _id: user._id }, { lastLoginAt: new Date() });
  return user;
};

module.exports = {
  issueTokens,
  revokeAllForUser,
  register,
  login,
  refresh,
  logout,
  findOrCreateSocialUser,
};
