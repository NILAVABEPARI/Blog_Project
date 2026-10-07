import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import PostForm from '@/components/posts/PostForm'
import ErrorMessage from '@/components/common/ErrorMessage'
import PageLoader from '@/components/common/PageLoader'
import { clearCurrentPost, createPost, fetchPostBySlug, updatePost } from '@/store/slices/postsSlice'
import { selectIsAdmin, selectUser } from '@/store/slices/authSlice'
import NotFound from './NotFound'

/** Handles both /posts/new and /posts/:slug/edit. */
export default function PostEditor() {
  const { slug } = useParams()
  const isEdit = Boolean(slug)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector(selectUser)
  const isAdmin = useSelector(selectIsAdmin)
  const { post, status, error, statusCode } = useSelector((s) => s.posts.current)

  useEffect(() => {
    if (!isEdit) return undefined
    dispatch(fetchPostBySlug(slug))
    return () => {
      dispatch(clearCurrentPost())
    }
  }, [dispatch, isEdit, slug])

  // unwrap() rejects with the normalized API error, which PostForm turns into field messages
  const handleCreate = async (values) => {
    const result = await dispatch(createPost(values)).unwrap()
    toast.success('Post published')
    navigate(`/posts/${result.data.post.slug}`)
  }

  const handleUpdate = async (values) => {
    const result = await dispatch(updatePost({ id: post._id, data: values })).unwrap()
    toast.success('Post updated')
    navigate(`/posts/${result.data.post.slug}`)
  }

  if (!isEdit) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Write a new post</h1>
        <PostForm submitLabel="Publish" onSubmit={handleCreate} onCancel={() => navigate(-1)} />
      </div>
    )
  }

  if (status === 'failed') {
    return statusCode === 404 ? <NotFound title="Post not found" /> : <ErrorMessage message={error} />
  }
  if (!post) return <PageLoader />

  const canEdit = post.author?._id === user?._id || isAdmin
  if (!canEdit) return <ErrorMessage title="Not allowed" message="You can only edit your own posts." />

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Edit post</h1>
      <PostForm
        initial={{ title: post.title, content: post.content }}
        submitLabel="Save changes"
        onSubmit={handleUpdate}
        onCancel={() => navigate(-1)}
      />
    </div>
  )
}
