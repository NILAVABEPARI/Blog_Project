import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { adminApi, postsApi, commentsApi } from '@/api/services'
import { normalizeError } from '@/api/client'

const thunk = (type, fn) =>
  createAsyncThunk(type, async (arg, { rejectWithValue }) => {
    try {
      return await fn(arg)
    } catch (err) {
      return rejectWithValue(normalizeError(err))
    }
  })

export const fetchStats = thunk('admin/stats', () => adminApi.stats())
export const fetchUsers = thunk('admin/users', (params) => adminApi.users(params))
export const updateUser = thunk('admin/updateUser', ({ id, data }) => adminApi.updateUser(id, data))
export const deleteUser = thunk('admin/deleteUser', async (id) => {
  await adminApi.deleteUser(id)
  return { id }
})
export const fetchAdminPosts = thunk('admin/posts', (params) => adminApi.posts(params))
export const softDeletePost = thunk('admin/softDeletePost', async (id) => {
  await postsApi.remove(id)
  return { id }
})
export const restorePost = thunk('admin/restorePost', async (id) => {
  await adminApi.restorePost(id)
  return { id }
})
export const purgePost = thunk('admin/purgePost', async (id) => {
  await adminApi.purgePost(id)
  return { id }
})
export const fetchAdminComments = thunk('admin/comments', (params) => adminApi.comments(params))
export const deleteAdminComment = thunk('admin/deleteComment', async (id) => {
  await commentsApi.remove(id)
  return { id }
})
export const fetchActivityLogs = thunk('admin/logs', (params) => adminApi.activityLogs(params))

const emptyList = () => ({ items: [], meta: null, status: 'idle', error: null })

const listCases = (builder, action, key, dataKey) => {
  builder
    .addCase(action.pending, (state) => {
      state[key].status = 'loading'
      state[key].error = null
    })
    .addCase(action.fulfilled, (state, { payload }) => {
      state[key].status = 'succeeded'
      state[key].items = payload.data[dataKey]
      state[key].meta = payload.meta
    })
    .addCase(action.rejected, (state, { payload }) => {
      state[key].status = 'failed'
      state[key].error = payload?.message || 'Request failed'
    })
}

const removeFromList = (state, key, id) => {
  state[key].items = state[key].items.filter((item) => item._id !== id)
  if (state[key].meta) state[key].meta.total = Math.max(0, state[key].meta.total - 1)
}

const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    stats: { data: null, status: 'idle', error: null },
    users: emptyList(),
    posts: emptyList(),
    comments: emptyList(),
    logs: emptyList(),
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStats.pending, (state) => {
        state.stats.status = 'loading'
      })
      .addCase(fetchStats.fulfilled, (state, { payload }) => {
        state.stats = { data: payload.data.stats, status: 'succeeded', error: null }
      })
      .addCase(fetchStats.rejected, (state, { payload }) => {
        state.stats.status = 'failed'
        state.stats.error = payload?.message || 'Failed to load statistics'
      })

    listCases(builder, fetchUsers, 'users', 'users')
    listCases(builder, fetchAdminPosts, 'posts', 'posts')
    listCases(builder, fetchAdminComments, 'comments', 'comments')
    listCases(builder, fetchActivityLogs, 'logs', 'logs')

    builder
      .addCase(updateUser.fulfilled, (state, { payload }) => {
        const updated = payload.data.user
        const index = state.users.items.findIndex((u) => u._id === updated._id)
        if (index !== -1) state.users.items[index] = { ...state.users.items[index], ...updated }
      })
      .addCase(deleteUser.fulfilled, (state, { payload }) => removeFromList(state, 'users', payload.id))
      // The posts table is filtered by status, so a soft delete / restore / purge always removes the row
      .addCase(softDeletePost.fulfilled, (state, { payload }) => removeFromList(state, 'posts', payload.id))
      .addCase(restorePost.fulfilled, (state, { payload }) => removeFromList(state, 'posts', payload.id))
      .addCase(purgePost.fulfilled, (state, { payload }) => removeFromList(state, 'posts', payload.id))
      .addCase(deleteAdminComment.fulfilled, (state, { payload }) => removeFromList(state, 'comments', payload.id))
  },
})

export default adminSlice.reducer
