/**
 * Creates (or promotes) the first admin using ADMIN_EMAIL / ADMIN_PASSWORD from .env.
 * Public registration can only ever create regular users, so this is how admins are bootstrapped.
 *   npm run seed:admin
 */
const env = require('../config/env');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const { ROLES } = require('../constants/roles');

(async () => {
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
    console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD in your .env first.');
    process.exit(1);
  }

  await connectDB();
  const email = env.ADMIN_EMAIL.toLowerCase();
  let user = await User.findOne({ email });

  if (user) {
    user.role = ROLES.ADMIN;
    user.isActive = true;
    await user.save();
    console.log(`Existing user ${email} promoted to admin.`);
  } else {
    user = await User.create({ name: env.ADMIN_NAME, email, password: env.ADMIN_PASSWORD, role: ROLES.ADMIN });
    console.log(`Admin created: ${email}`);
  }

  await disconnectDB();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
