import axios from 'axios'

/**
 * Axios instance for the backend.
 *  - In development the Vite dev server proxies /api to the backend, so the default base URL is relative.
 *  - Set VITE_API_URL to call the API directly (the backend must then allow this origin via CLIENT_URL).
 *
 * Auth model (matches the backend):
 *  - The short-lived access token lives in Redux memory and is sent as a Bearer header.
 *  - The refresh token is an httpOnly cookie. When a request fails with 401 we call POST /auth/refresh once,
 *    store the new access token and replay the request.
 */
export const API_URL = import.meta.env.VITE_API_URL || '/api/v1'

export const api = axios.create({ baseURL: API_URL, withCredentials: true })

// A bare client (no interceptors) for the refresh call itself, so it can never loop
const bare = axios.create({ baseURL: API_URL, withCredentials: true })

// The store registers these callbacks (see store/index.js) so this file never imports Redux
const handlers = { getToken: () => null, onRefreshed: () => {}, onExpired: () => {} }
export const setupApi = (custom) => Object.assign(handlers, custom)

/**
 * Exchanges the refresh cookie for a new access token.
 * The in-flight promise is shared: the backend rotates refresh tokens and treats a replayed token as theft,
 * so two simultaneous refresh calls (React StrictMode, parallel 401s) must never both be sent.
 */
let refreshPromise = null
export const refreshSession = () => {
  if (!refreshPromise) {
    refreshPromise = bare
      .post('/auth/refresh')
      .then((res) => {
        const data = res.data.data // { user, accessToken }
        handlers.onRefreshed(data)
        return data
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

api.interceptors.request.use((config) => {
  const token = handlers.getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

const AUTH_ENDPOINTS = /\/auth\/(login|register|refresh|logout)/

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && original && !original._retried && !AUTH_ENDPOINTS.test(original.url || '')) {
      original._retried = true
      try {
        const { accessToken } = await refreshSession()
        original.headers.Authorization = `Bearer ${accessToken}`
        return api(original)
      } catch {
        handlers.onExpired()
      }
    }
    return Promise.reject(error)
  }
)

/** Turns any axios error into a plain, serializable object that Redux can store. */
export const normalizeError = (err) => ({
  message:
    err?.response?.data?.message ||
    (err?.request ? 'Cannot reach the server. Please try again.' : err?.message) ||
    'Something went wrong',
  errors: err?.response?.data?.errors || [],
  status: err?.response?.status,
})

/** [{ field: 'email', message: '...' }] -> { email: '...' } */
export const toFieldErrors = (error) =>
  (error?.errors || []).reduce((acc, { field, message }) => {
    if (field && !acc[field]) acc[field] = message
    return acc
  }, {})
