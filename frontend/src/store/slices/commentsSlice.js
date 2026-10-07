import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { commentsApi } from '@/api/services'
import { normalizeError } from '@/api/client'

const thunk = (type, fn) =>
  createAsyncThunk(type, async (arg, { rejectWithValue }) => {
    try {
      return await fn(arg)
    } catch (err) {
      return rejectWithValue(normalizeError(err))
    }
  })

export const fetchComments = thunk('comments/fetch', async ({ postId, page = 1, limit = 10 }) => {
  const res = await commentsApi.list(postId, { page, limit })
  return { ...res, page }
})
export const addComment = thunk('comments/add', ({ postId, content }) => commentsApi.create(postId, { content }))
export const editComment = thunk('comments/edit', ({ id, content }) => commentsApi.update(id, { content }))
export const removeComment = thunk('comments/remove', async (id) => {
  await commentsApi.remove(id)
  return { id }
})

const commentsSlice = createSlice({
  name: 'comments',
  initialState: { items: [], meta: null, status: 'idle', error: null },
  reducers: {
    resetComments: () => ({ items: [], meta: null, status: 'idle', error: null }),
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchComments.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchComments.fulfilled, (state, { payload }) => {
        state.status = 'succeeded'
        // Page 1 replaces the list, later pages are appended ("load more")
        state.items = payload.page > 1 ? [...state.items, ...payload.data.comments] : payload.data.comments
        state.meta = payload.meta
      })
      .addCase(fetchComments.rejected, (state, { payload }) => {
        state.status = 'failed'
        state.error = payload?.message || 'Failed to load comments'
      })
      .addCase(addComment.fulfilled, (state, { payload }) => {
        state.items.unshift(payload.data.comment)
        if (state.meta) state.meta.total += 1
      })
      .addCase(editComment.fulfilled, (state, { payload }) => {
        const updated = payload.data.comment
        const index = state.items.findIndex((c) => c._id === updated._id)
        if (index !== -1) state.items[index] = updated
      })
      .addCase(removeComment.fulfilled, (state, { payload }) => {
        state.items = state.items.filter((c) => c._id !== payload.id)
        if (state.meta) state.meta.total = Math.max(0, state.meta.total - 1)
      })
  },
})

export const { resetComments } = commentsSlice.actions
export default commentsSlice.reducer
