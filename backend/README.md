# MERN Blog: Backend API

REST API for a blog system built with **Node.js, Express 5, MongoDB (Mongoose)**.
JWT access + refresh tokens, Google/Facebook OAuth 2.0, role-based access control, posts (soft delete + slugs), comments and an admin API.

## Quick start

```bash
cd backend
npm install
cp .env.example .env        # then edit the secrets / MONGO_URI
npm run seed:admin          # creates the first admin from ADMIN_EMAIL / ADMIN_PASSWORD
npm run dev                 # http://localhost:5000/api/v1
```

Requirements: Node 20+, a running MongoDB (local `mongodb://127.0.0.1:27017` or an Atlas URI).

## Environment variables (`.env`)

| Variable | Purpose |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `CLIENT_URL` | Allowed frontend origin(s), comma separated (CORS + OAuth redirect) |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | Two different long random strings |
| `JWT_ACCESS_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN_DAYS` | Default `15m` / `7` |
| `BCRYPT_SALT_ROUNDS` | Default `12` |
| `COOKIE_SAME_SITE` | `lax` (same site), `none` (cross-site, needs HTTPS) |
| `AUTH_RATE_LIMIT_MAX` | Auth attempts per 15 min per IP (default 10) |
| `GOOGLE_CLIENT_ID/SECRET`, `FACEBOOK_APP_ID/SECRET` | OAuth credentials; leave blank to disable a provider |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | Used by `npm run seed:admin` |

The server validates the environment at startup and refuses to boot with missing or weak secrets.

## Architecture

```
src/
  config/        env (Zod-validated), db, passport strategies
  constants/     roles
  models/        User, Post, Comment, RefreshToken, ActivityLog (indexes live here)
  validators/    Zod schemas for body / params / query
  middleware/    authenticate, authorize (RBAC + ownership), validate, activityLogger,
                 rateLimiter, oauth, errorHandler, notFound
  services/      business logic (auth, post, comment, admin, activity)
  controllers/   thin HTTP layer: parse request -> call service -> send response
  routes/v1/     Express routers grouped by resource, mounted under /api/v1
  utils/         ApiError, apiResponse, pagination, token helpers, logger
tests/           unit/ (no DB) and integration/ (HTTP + MongoDB)
```

Request flow: `route -> rate limiter -> authenticate -> authorize -> validate -> activity log -> controller -> service -> model`.

### Key design decisions

- **Tokens**: the short-lived access token is returned in JSON and sent as `Authorization: Bearer`. The refresh token is an `httpOnly` cookie scoped to `/api/v1/auth`, stored **hashed** in MongoDB, and **rotated on every use**. Re-using an old refresh token revokes all of that user's sessions.
- **RBAC at the API level**: `authorize('admin')` guards the whole `/admin` router; `authorizeOwnerOrAdmin` protects post/comment edits and deletes. `authenticate` reloads the user on each request, so role changes and deactivation apply immediately.
- **Registration can never create an admin.** Admins come from `npm run seed:admin` or from another admin via `PATCH /admin/users/:id`.
- **Soft delete**: posts get `isDeleted/deletedAt/deletedBy`; all public queries filter on it. Admins can list, restore or permanently purge.
- **Slugs**: generated from the title, made unique with a random suffix on collision, and kept stable when the title is edited.
- **Performance**: indexes on feed, author, comment-by-post, text search and TTL for expired tokens; every list is paginated (max 50); list queries use `.lean()`, skip `content` (a stored `excerpt` is returned) and populate only `name avatar`.
- **Errors**: one JSON shape everywhere: `{ success:false, message, errors? }`. Zod, Mongoose, JWT and duplicate-key errors are translated centrally.
- **Social login**: Authorization Code flow via Passport. After the provider callback the API sets the refresh cookie and redirects to `CLIENT_URL/oauth/callback`; the SPA then calls `POST /auth/refresh` to get an access token, so no token is ever placed in a URL. Existing accounts with the same email are linked.

## Response format

```json
{ "success": true, "message": "Posts retrieved", "data": { "posts": [] },
  "meta": { "page": 1, "limit": 10, "total": 42, "totalPages": 5, "hasNextPage": true, "hasPrevPage": false } }
```
```json
{ "success": false, "message": "Validation failed", "errors": [{ "field": "email", "message": "Please provide a valid email" }] }
```

## API overview (`/api/v1`)

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/auth/register` | public (rate limited) | Create account, returns access token + sets refresh cookie |
| POST | `/auth/login` | public (rate limited) | Log in |
| POST | `/auth/refresh` | refresh cookie | Rotate refresh token, get new access token |
| POST | `/auth/logout` | refresh cookie | Revoke refresh token, clear cookie |
| GET | `/auth/me` | user | Current user |
| GET | `/auth/google`, `/auth/facebook` | public | Start OAuth (callbacks at `/auth/{provider}/callback`) |
| GET | `/posts` | public | List posts: `page, limit, search, author, sort` |
| GET | `/posts/:idOrSlug` | public | Single post |
| POST | `/posts` | user | Create post |
| PATCH | `/posts/:id` | owner / admin | Update post |
| DELETE | `/posts/:id` | owner / admin | Soft delete |
| GET | `/posts/:postId/comments` | public | Comments of a post (paginated) |
| POST | `/posts/:postId/comments` | user | Add comment |
| PATCH | `/comments/:id` | owner / admin | Edit comment |
| DELETE | `/comments/:id` | owner / admin | Delete comment |
| GET | `/admin/stats` | admin | Totals: users, posts, comments (+ deleted posts) |
| GET | `/admin/users` | admin | List users: `page, limit, search, role, isActive` |
| GET / PATCH / DELETE | `/admin/users/:id` | admin | View / change name, role, isActive / delete (cascades) |
| GET | `/admin/posts` | admin | All posts, `status=active|deleted|all` |
| PATCH | `/admin/posts/:id/restore` | admin | Restore soft-deleted post |
| DELETE | `/admin/posts/:id/permanent` | admin | Hard delete post and its comments |
| GET | `/admin/comments` | admin | All comments, filter by `post`, `author` |
| GET | `/admin/activity-logs` | admin | Audit trail (login, post create/delete, ...) |
| GET | `/health` | public | Liveness + DB state |

Admin self-protection: an admin cannot demote, deactivate or delete their own account.

### Example

```bash
curl -c jar -X POST localhost:5000/api/v1/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"Admin@12345"}'
curl localhost:5000/api/v1/admin/stats -H "Authorization: Bearer <accessToken>"
```

## Testing

```bash
npm test                  # unit + integration with coverage
npm run test:unit         # no database needed
npm run test:integration
```

Integration tests start an in-memory MongoDB (`mongodb-memory-server`, downloads a binary on first run). To use your own server instead, set `TEST_MONGO_URI=mongodb://127.0.0.1:27017`.
Each test file runs in its own throwaway database.

## OAuth setup notes

- **Google**: create an OAuth client in Google Cloud Console, add redirect URI `http://localhost:5000/api/v1/auth/google/callback`.
- **Facebook**: create an app in Meta for Developers, enable Facebook Login, add the redirect URI `http://localhost:5000/api/v1/auth/facebook/callback`. The email permission must be granted, otherwise login is refused.
