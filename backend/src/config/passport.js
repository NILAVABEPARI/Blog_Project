const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const { Strategy: FacebookStrategy } = require('passport-facebook');
const env = require('./env');
const authService = require('../services/auth.service');

const isProviderConfigured = (provider) => {
  if (provider === 'google') return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
  if (provider === 'facebook') return Boolean(env.FACEBOOK_APP_ID && env.FACEBOOK_APP_SECRET);
  return false;
};

const verifyFactory = (provider) => async (_accessToken, _refreshToken, profile, done) => {
  try {
    const user = await authService.findOrCreateSocialUser({
      provider,
      providerId: profile.id,
      email: profile.emails?.[0]?.value,
      name: profile.displayName,
      avatar: profile.photos?.[0]?.value,
    });
    done(null, user);
  } catch (err) {
    done(err);
  }
};

const configurePassport = () => {
  if (isProviderConfigured('google')) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
          callbackURL: env.GOOGLE_CALLBACK_URL,
        },
        verifyFactory('google')
      )
    );
  }

  if (isProviderConfigured('facebook')) {
    passport.use(
      new FacebookStrategy(
        {
          clientID: env.FACEBOOK_APP_ID,
          clientSecret: env.FACEBOOK_APP_SECRET,
          callbackURL: env.FACEBOOK_CALLBACK_URL,
          profileFields: ['id', 'displayName', 'emails', 'photos'],
        },
        verifyFactory('facebook')
      )
    );
  }

  return passport;
};

module.exports = { configurePassport, isProviderConfigured };
