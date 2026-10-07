const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const env = require('./config/env');
const { configurePassport } = require('./config/passport');
const { globalLimiter } = require('./middleware/rateLimiter');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes/v1');

const app = express();

// Behind a reverse proxy (Render, Heroku, nginx...) the real client IP is needed for rate limiting
if (env.IS_PROD) app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: env.CLIENT_ORIGINS, credentials: true }));
if (env.NODE_ENV !== 'test') app.use(morgan(env.IS_PROD ? 'combined' : 'dev'));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
app.use(configurePassport().initialize());

app.use('/api', globalLimiter);
app.use('/api/v1', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
