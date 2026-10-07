import { configureStore } from '@reduxjs/toolkit'
import authReducer, { clearCredentials, setCredentials } from './slices/authSlice'
import postsReducer from './slices/postsSlice'
import commentsReducer from './slices/commentsSlice'
import adminReducer from './slices/adminSlice'
import { setupApi } from '@/api/client'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    posts: postsReducer,
    comments: commentsReducer,
    admin: adminReducer,
  },
})

// Connect the axios client to the store without creating a circular import
setupApi({
  getToken: () => store.getState().auth.accessToken,
  onRefreshed: (data) => store.dispatch(setCredentials(data)),
  onExpired: () => store.dispatch(clearCredentials()),
})
