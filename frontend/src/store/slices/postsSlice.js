import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { postsApi } from '@/api/services'
import { normalizeError } from '@/api/client'

const emptyList = { items: [], meta: null, status: 'idle', error: null }

const thunk = (type, fn) =>
  createAsyncThunk(type, async (arg, { rejectWithValue }) => {
    try {
      return await fn(arg)
    } catch (err) {
      return rejectWithValue(normalizeError(err))
    }
  })

export const fetchPosts = thunk('posts/fetchList', (params) => postsApi.list(params))
export const fetchMyPosts = thunk('posts/fetchMine', (params) => postsApi.list(params))
export const fetchPostBySlug = thunk('posts/fetchOne', (slug) => postsApi.get(slug))
export const createPost = thunk('posts/create', (body) => postsApi.create(body))
export const updatePost = thunk('posts/update', ({ id, data }) => postsApi.update(id, data))
export const deletePost = thunk('posts/delete', async (id) => {
  await postsApi.remove(id)
  return { id }
})

const listReducers = (builder, thunkAction, key) => {
  builder
    .addCase(thunkAction.pending, (state) => {
      state[key].status = 'loading'
      state[key].error = null
    })
    .addCase(thunkAction.fulfilled, (state, { payload }) => {
      state[key].status = 'succeeded'
      state[key].items = payload.data.posts
      state[key].meta = payload.meta
    })
    .addCase(thunkAction.rejected, (state, { payload }) => {
      state[key].status = 'failed'
      state[key].error = payload?.message || 'Failed to load posts'
    })
}

const postsSlice = createSlice({
  name: 'posts',
  initialState: {
    list: { ...emptyList },
    mine: { ...emptyList },
    current: { post: null, status: 'idle', error: null, statusCode: null },
  },
  reducers: {
    clearCurrentPost(state) {
      state.current = { post: null, status: 'idle', error: null, statusCode: null }
    },
  },
  extraReducers: (builder) => {
    listReducers(builder, fetchPosts, 'list')
    listReducers(builder, fetchMyPosts, 'mine')

    builder
      .addCase(fetchPostBySlug.pending, (state) => {
        state.current = { post: null, status: 'loading', error: null, statusCode: null }
      })
      .addCase(fetchPostBySlug.fulfilled, (state, { payload }) => {
        state.current = { post: payload.data.post, status: 'succeeded', error: null, statusCode: null }
      })
      .addCase(fetchPostBySlug.rejected, (state, { payload }) => {
        state.current = {
          post: null,
          status: 'failed',
          error: payload?.message || 'Failed to load post',
          statusCode: payload?.status ?? null,
        }
      })
      .addCase(updatePost.fulfilled, (state, { payload }) => {
        state.current.post = payload.data.post
      })
      .addCase(deletePost.fulfilled, (state, { payload }) => {
        for (const key of ['list', 'mine']) {
          state[key].items = state[key].items.filter((p) => p._id !== payload.id)
          if (state[key].meta) state[key].meta.total = Math.max(0, state[key].meta.total - 1)
        }
      })
  },
})

export const { clearCurrentPost } = postsSlice.actions
export default postsSlice.reducer
