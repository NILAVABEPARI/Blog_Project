import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { authApi } from '@/api/services'
import { normalizeError, refreshSession } from '@/api/client'

const initialState = {
  user: null,
  accessToken: null,
  initialized: false, // true once the first "am I logged in?" check has finished
  status: 'idle', // idle | loading
}

/** Runs once on app start (and after OAuth): trades the refresh cookie for a session. */
export const bootstrapAuth = createAsyncThunk('auth/bootstrap', async (_, { rejectWithValue }) => {
  try {
    return await refreshSession()
  } catch (err) {
    return rejectWithValue(normalizeError(err))
  }
})

export const loginUser = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    return (await authApi.login(credentials)).data
  } catch (err) {
    return rejectWithValue(normalizeError(err))
  }
})

export const registerUser = createAsyncThunk('auth/register', async (payload, { rejectWithValue }) => {
  try {
    return (await authApi.register(payload)).data
  } catch (err) {
    return rejectWithValue(normalizeError(err))
  }
})

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  try {
    await authApi.logout()
  } catch {
    // The local session is cleared regardless of the network result
  }
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, { payload }) {
      state.user = payload.user
      state.accessToken = payload.accessToken
    },
    clearCredentials(state) {
      state.user = null
      state.accessToken = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapAuth.fulfilled, (state, { payload }) => {
        state.user = payload.user
        state.accessToken = payload.accessToken
        state.initialized = true
      })
      .addCase(bootstrapAuth.rejected, (state) => {
        state.user = null
        state.accessToken = null
        state.initialized = true
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null
        state.accessToken = null
      })

    for (const thunk of [loginUser, registerUser]) {
      builder
        .addCase(thunk.pending, (state) => {
          state.status = 'loading'
        })
        .addCase(thunk.fulfilled, (state, { payload }) => {
          state.status = 'idle'
          state.user = payload.user
          state.accessToken = payload.accessToken
          state.initialized = true
        })
        .addCase(thunk.rejected, (state) => {
          state.status = 'idle'
        })
    }
  },
})

export const { setCredentials, clearCredentials } = authSlice.actions
export default authSlice.reducer

export const selectUser = (state) => state.auth.user
export const selectIsAdmin = (state) => state.auth.user?.role === 'admin'
export const selectAuthInitialized = (state) => state.auth.initialized
