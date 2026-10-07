import { api } from './client'

const unwrap = (promise) => promise.then((res) => res.data)

export const authApi = {
  register: (body) => unwrap(api.post('/auth/register', body)),
  login: (body) => unwrap(api.post('/auth/login', body)),
  logout: () => unwrap(api.post('/auth/logout')),
}

export const postsApi = {
  list: (params) => unwrap(api.get('/posts', { params })),
  get: (idOrSlug) => unwrap(api.get(`/posts/${idOrSlug}`)),
  create: (body) => unwrap(api.post('/posts', body)),
  update: (id, body) => unwrap(api.patch(`/posts/${id}`, body)),
  remove: (id) => unwrap(api.delete(`/posts/${id}`)),
}

export const commentsApi = {
  list: (postId, params) => unwrap(api.get(`/posts/${postId}/comments`, { params })),
  create: (postId, body) => unwrap(api.post(`/posts/${postId}/comments`, body)),
  update: (id, body) => unwrap(api.patch(`/comments/${id}`, body)),
  remove: (id) => unwrap(api.delete(`/comments/${id}`)),
}

export const adminApi = {
  stats: () => unwrap(api.get('/admin/stats')),
  users: (params) => unwrap(api.get('/admin/users', { params })),
  updateUser: (id, body) => unwrap(api.patch(`/admin/users/${id}`, body)),
  deleteUser: (id) => unwrap(api.delete(`/admin/users/${id}`)),
  posts: (params) => unwrap(api.get('/admin/posts', { params })),
  restorePost: (id) => unwrap(api.patch(`/admin/posts/${id}/restore`)),
  purgePost: (id) => unwrap(api.delete(`/admin/posts/${id}/permanent`)),
  comments: (params) => unwrap(api.get('/admin/comments', { params })),
  activityLogs: (params) => unwrap(api.get('/admin/activity-logs', { params })),
}
