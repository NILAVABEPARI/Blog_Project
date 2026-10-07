# Inkwell: MERN Blog Frontend

React (JavaScript) single-page app for the blog API. **Redux Toolkit** for global state, **shadcn/ui** components, **Tailwind CSS v4** for styling, **React Router** for routing, **Axios** for HTTP.

## Quick start

```bash
cd frontend
npm install
cp .env.example .env       # optional, defaults work with the backend on :5000
npm run dev                # http://localhost:5173
```

Start the backend first (`cd ../backend && npm run dev`). In development Vite proxies `/api` to `VITE_PROXY_TARGET` (default `http://localhost:5000`), so the browser only ever talks to `:5173`. That keeps the httpOnly refresh cookie same-origin and needs no CORS setup.

To call the API directly instead, set `VITE_API_URL=http://localhost:5000/api/v1` and make sure the backend's `CLIENT_URL` includes the frontend origin.

```bash
npm run build              # production build in dist/
npm run preview
```

For production hosting, serve `dist/` and either reverse-proxy `/api` to the backend (same site, simplest) or set `VITE_API_URL` at build time plus `COOKIE_SAME_SITE=none` on the backend (HTTPS required).

## Features

| Area | What it does |
|---|---|
| Auth | Register, login, logout, session restore on page load, Google / Facebook login |
| Posts | Public feed with URL-driven search, sort and pagination; post page; create / edit / delete (owner or admin); "My posts" |
| Comments | List with "load more", add, edit own, delete own (admins can delete any) |
| Admin panel | Dashboard (users / posts / comments totals), user management (role, activate, delete), post moderation (delete, restore, purge), all comments, activity log |
| UX | Dark mode, loading skeletons, empty and error states, toasts, confirm dialogs, responsive layout |

## Routes

| Path | Access |
|---|---|
| `/` , `/posts/:slug` | public |
| `/login`, `/register` | guests only |
| `/oauth/callback` | landing page after social login |
| `/posts/new`, `/posts/:slug/edit`, `/my-posts` | signed-in users |
| `/admin`, `/admin/users`, `/admin/posts`, `/admin/comments`, `/admin/activity` | admins only |

Route guards (`components/routing/guards.jsx`) are a UX convenience. The backend enforces every permission, so editing client code never grants access.

## Structure

```
src/
  api/          client.js (axios, interceptors, token refresh)  services.js (endpoint functions)
  store/        index.js + slices: auth, posts, comments, admin
  components/
    ui/         shadcn/ui components (button, card, table, select, alert-dialog, ...)
    layout/     Navbar, Layout, AdminLayout
    routing/    ProtectedRoute, AdminRoute, GuestRoute
    common/     Pagination, ConfirmDialog, DataState, EmptyState, ...
    posts/ comments/ auth/
  pages/        route components (admin/ for the panel)
  hooks/ lib/   useDebounce, cn() and formatters
```

## How auth works

1. Login/register returns an **access token** (15 min), kept only in Redux memory, and sets an **httpOnly refresh cookie**.
2. Axios adds `Authorization: Bearer <token>` to every request.
3. On a `401` the interceptor calls `POST /auth/refresh` **once**, stores the new token and replays the request. Parallel failures share one refresh call, because the backend rotates refresh tokens and treats a replayed one as theft.
4. On app start `bootstrapAuth` runs the same refresh to restore the session after a reload. If it fails, the user is simply logged out.
5. Social login is a full-page redirect to `/api/v1/auth/{google|facebook}`. After the provider, the backend sets the cookie and redirects to `/oauth/callback`, which exchanges the cookie for an access token, so tokens never appear in URLs.

Google / Facebook buttons only work once the backend has the provider credentials configured (otherwise it responds `501`).

## Using shadcn/ui

`components.json` is included, so the CLI works as usual:

```bash
npx shadcn@latest add dialog tabs dropdown-menu
```

The components already in `src/components/ui` match the CLI's "new-york" style, and theme colors live in `src/index.css`.
