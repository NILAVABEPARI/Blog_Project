# MERN Blog Application

A full-stack blog platform built with the **MERN stack**, featuring secure authentication, social login, blog management, role-based access control, and a modern responsive UI.

## 🚀 Tech Stack

### Frontend

- React.js
- JavaScript / TypeScript
- Tailwind CSS
- Axios
- React Router

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- Passport.js
- Google OAuth
- Facebook OAuth

### Development Tools

- Git & GitHub
- VS Code
- npm

---

# ✨ Features

## 🔐 Authentication & Authorization

- User registration and login
- Secure password-based authentication
- JWT-based authentication
- Protected routes
- Role-based access control
- Admin authentication
- Logout functionality
- Google OAuth login
- Facebook OAuth login
- Automatic user creation for social-login users

## 📝 Blog Management

Authenticated users can:

- Create blog posts
- Edit their posts
- Delete their posts
- View published posts
- View individual blog posts
- Manage their own content

## 👨‍💼 Admin Features

Administrators can:

- Access the admin dashboard
- Manage users
- Manage blog posts
- View and control application content
- Perform administrative operations through protected APIs

## 🎨 Frontend

- Responsive UI
- Reusable React components
- Client-side routing
- Authentication-aware UI
- Protected pages
- Form validation
- API integration using Axios

## 🔒 Security

- Passwords are securely hashed before storage
- JWT tokens are used for authentication
- Protected API routes
- Role-based authorization
- Environment variables for sensitive credentials
- OAuth client secrets are kept on the backend

---

# 📁 Project Structure

```text
mern-blog/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── context/
│   │   └── App.jsx
│   │
│   ├── public/
│   ├── package.json
│   └── .env
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── scripts/
│   │   └── app.js
│   │
│   ├── package.json
│   └── .env
│
├── .gitignore
└── README.md
```

> The exact folder structure may vary depending on the implementation.

---

# ⚙️ Installation

## Prerequisites

Make sure you have the following installed:

- Node.js 18+
- npm
- MongoDB
- Git

You can verify your installation with:

```bash
node --version
npm --version
git --version
```

---

## 1. Clone the Repository

```bash
git clone https://github.com/NILAVABEPARI/Blog_Project.git
```

Navigate into the project:

```bash
cd Blog_Project
```

---

# 🖥️ Backend Setup

Navigate to the backend:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file:

```env
PORT=5000

MONGODB_URI=mongodb://localhost:27017/mern_blog

JWT_SECRET=your_jwt_secret

FRONTEND_URL=http://localhost:5173

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Facebook OAuth
FACEBOOK_CLIENT_ID=your_facebook_app_id
FACEBOOK_CLIENT_SECRET=your_facebook_app_secret
FACEBOOK_CALLBACK_URL=http://localhost:5000/api/auth/facebook/callback
```

Start the backend:

```bash
npm run dev
```

The backend should now be running at:

```text
http://localhost:5000
```

---

# 🌐 Frontend Setup

Open another terminal and navigate to the frontend:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

The frontend should now be available at:

```text
http://localhost:5173
```

---

# 🔑 Environment Variables

Never commit your `.env` files to GitHub.

Add them to `.gitignore`:

```gitignore
node_modules/
.env
.env.local
dist/
build/
```

### Backend Variables

| Variable                 | Description                    |
| ------------------------ | ------------------------------ |
| `PORT`                   | Port on which the backend runs |
| `MONGODB_URI`            | MongoDB connection string      |
| `JWT_SECRET`             | Secret used to sign JWT tokens |
| `FRONTEND_URL`           | Frontend application URL       |
| `GOOGLE_CLIENT_ID`       | Google OAuth client ID         |
| `GOOGLE_CLIENT_SECRET`   | Google OAuth client secret     |
| `GOOGLE_CALLBACK_URL`    | Google OAuth callback URL      |
| `FACEBOOK_CLIENT_ID`     | Facebook OAuth app ID          |
| `FACEBOOK_CLIENT_SECRET` | Facebook OAuth app secret      |
| `FACEBOOK_CALLBACK_URL`  | Facebook OAuth callback URL    |

### Frontend Variables

| Variable       | Description                 |
| -------------- | --------------------------- |
| `VITE_API_URL` | Base URL of the backend API |

---

# 🔐 OAuth Configuration

## Google Login

To enable Google authentication:

1. Create a project in Google Cloud Console.
2. Configure the OAuth consent screen.
3. Create an OAuth 2.0 Client ID.
4. Add the authorized redirect URI:

```text
http://localhost:5000/api/auth/google/callback
```

5. Add the generated credentials to the backend `.env`.

For production, replace the localhost URL with the production callback URL.

---

## Facebook Login

To enable Facebook authentication:

1. Create an application in Meta for Developers.
2. Add Facebook Login.
3. Configure the OAuth settings.
4. Add the following callback URL:

```text
http://localhost:5000/api/auth/facebook/callback
```

5. Add the App ID and App Secret to the backend `.env`.

```env
FACEBOOK_CLIENT_ID=your_app_id
FACEBOOK_CLIENT_SECRET=your_app_secret
FACEBOOK_CALLBACK_URL=http://localhost:5000/api/auth/facebook/callback
```

> OAuth client secrets must never be exposed in the frontend or committed to GitHub.

---

# 🌱 Database Setup

The application uses **MongoDB** as its primary database.

Make sure MongoDB is running locally or provide a MongoDB Atlas connection string.

Example:

```env
MONGODB_URI=mongodb://localhost:27017/mern_blog
```

For MongoDB Atlas:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/mern_blog
```

---

# 👤 Admin Setup

If the project contains an admin seed script, run:

```bash
npm run seed:admin
```

The script creates the initial administrator account.

> Make sure the MongoDB connection is configured correctly before running the seed script.

---

# 📡 API Documentation

The backend exposes REST APIs under:

```text
/api
```

## Authentication

### Register

```http
POST /api/auth/register
```

Creates a new user account.

Example request:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

---

### Login

```http
POST /api/auth/login
```

Authenticates a user and returns an authentication token.

---

### Google Login

```http
GET /api/auth/google
```

Redirects the user to Google authentication.

Callback:

```http
GET /api/auth/google/callback
```

---

### Facebook Login

```http
GET /api/auth/facebook
```

Redirects the user to Facebook authentication.

Callback:

```http
GET /api/auth/facebook/callback
```

---

### Get Current User

```http
GET /api/auth/me
```

Returns the currently authenticated user.

Requires:

```http
Authorization: Bearer <JWT_TOKEN>
```

---

# 📝 Blog APIs

## Get All Posts

```http
GET /api/posts
```

Returns a list of published blog posts.

---

## Get Single Post

```http
GET /api/posts/:id
```

Returns details of a specific blog post.

---

## Create Post

```http
POST /api/posts
```

Creates a new blog post.

Authentication required.

Example:

```json
{
  "title": "Introduction to Node.js",
  "content": "Node.js is a JavaScript runtime...",
  "category": "Technology"
}
```

---

## Update Post

```http
PUT /api/posts/:id
```

Updates an existing blog post.

Authentication required.

---

## Delete Post

```http
DELETE /api/posts/:id
```

Deletes a blog post.

Authentication required.

---

# 👨‍💼 Admin APIs

Admin endpoints are protected using authentication and role-based authorization.

Typical admin operations include:

```http
GET    /api/admin/users
DELETE /api/admin/users/:id
GET    /api/admin/posts
DELETE /api/admin/posts/:id
```

Only users with the appropriate administrator role can access these endpoints.

---

# 🔄 Authentication Flow

The application uses JWT-based authentication.

```text
             ┌──────────────┐
             │    React     │
             │   Frontend   │
             └──────┬───────┘
                    │
                    │ Login
                    ▼
             ┌──────────────┐
             │   Express    │
             │    API       │
             └──────┬───────┘
                    │
                    ▼
             ┌──────────────┐
             │   MongoDB    │
             │    User      │
             └──────────────┘
                    │
                    │ JWT
                    ▼
             ┌──────────────┐
             │    React     │
             │ Authenticated│
             │    Session   │
             └──────────────┘
```

For social authentication:

```text
React
  │
  ▼
Backend
  │
  ▼
Google / Facebook
  │
  ▼
OAuth Callback
  │
  ▼
Find/Create User
  │
  ▼
Generate JWT
  │
  ▼
React Application
```

---

# 🧪 Testing the API

You can test the API using tools such as:

- Postman
- Thunder Client
- Insomnia
- cURL

Example:

```bash
curl http://localhost:5000/api/posts
```

For protected endpoints:

```http
Authorization: Bearer <your-jwt-token>
```

---

# 🛡️ Security Considerations

The application follows several security practices:

- Password hashing before storing credentials
- JWT-based authentication
- Protected API routes
- Role-based authorization
- OAuth authentication
- Server-side validation
- Environment variables for secrets
- No OAuth client secrets exposed to the frontend
- `.env` excluded from version control

For production deployment, additional protections such as rate limiting, CORS configuration, secure cookies, HTTPS, input sanitization, and security headers should also be configured.

---

# 🚀 Production Deployment

Before deploying:

1. Create a production MongoDB database.
2. Configure production environment variables.
3. Build the frontend:

```bash
npm run build
```

4. Deploy the backend to your preferred hosting provider.
5. Deploy the frontend.
6. Update OAuth callback URLs for the production domain.
7. Configure CORS to allow only the production frontend.
8. Never expose secrets in the frontend.

---

# 📌 Future Improvements

Potential improvements include:

- Comments and replies
- Post likes
- Bookmarking
- Search functionality
- Pagination
- Image uploads
- Rich-text editor
- Email verification
- Password reset
- Refresh-token based authentication
- Redis caching
- API rate limiting
- Automated testing
- CI/CD pipeline

---

# 🤝 Contributing

Contributions are welcome.

1. Fork the repository.
2. Create a feature branch:

```bash
git checkout -b feature/your-feature
```

3. Commit your changes:

```bash
git commit -m "Add your feature"
```

4. Push the branch:

```bash
git push origin feature/your-feature
```

5. Open a Pull Request.

---

# 📄 License

This project is intended for learning and demonstration purposes.

Add the appropriate license here if the project is distributed under a specific open-source license.

---

# 👨‍💻 Author

**Nilava Bepari**

Full Stack Developer | MERN | React | Node.js | MongoDB

GitHub: [https://github.com/NILAVABEPARI](https://github.com/NILAVABEPARI)

LinkedIn: [https://www.linkedin.com/in/nilava-bepari/](https://www.linkedin.com/in/nilava-bepari/)
