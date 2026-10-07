import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import ErrorMessage from '@/components/common/ErrorMessage'
import CommentSection from '@/components/comments/CommentSection'
import { clearCurrentPost, deletePost, fetchPostBySlug } from '@/store/slices/postsSlice'
import { selectIsAdmin, selectUser } from '@/store/slices/authSlice'
import { formatDate, getInitials } from '@/lib/utils'
import NotFound from './NotFound'

export default function PostDetail() {
  const { slug } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector(selectUser)
  const isAdmin = useSelector(selectIsAdmin)
  const { post, status, error, statusCode } = useSelector((s) => s.posts.current)
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    dispatch(fetchPostBySlug(slug))
    return () => {
      dispatch(clearCurrentPost())
    }
  }, [dispatch, slug])

  if (status === 'failed') {
    if (statusCode === 404) return <NotFound title="Post not found" message="It may have been removed or the link is wrong." />
    return <ErrorMessage message={error} onRetry={() => dispatch(fetchPostBySlug(slug))} />
  }

  if (!post) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const authorName = post.author?.name || 'Deleted user'
  const canManage = user && (post.author?._id === user._id || isAdmin)
  const wasEdited = post.updatedAt && post.updatedAt !== post.createdAt

  const handleDelete = async () => {
    try {
      await dispatch(deletePost(post._id)).unwrap()
      toast.success('Post deleted')
      navigate('/')
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <article className="mx-auto max-w-3xl space-y-8">
      <Button asChild variant="ghost" size="sm" className="-ml-3">
        <Link to="/">
          <ArrowLeft /> All posts
        </Link>
      </Button>

      <header className="space-y-4">
        <h1 className="text-4xl leading-tight font-bold tracking-tight break-words">{post.title}</h1>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar className="size-9">
              {post.author?.avatar && <AvatarImage src={post.author.avatar} alt={authorName} />}
              <AvatarFallback>{getInitials(authorName)}</AvatarFallback>
            </Avatar>
            <div className="text-sm">
              <p className="font-medium">{authorName}</p>
              <p className="text-muted-foreground">
                {formatDate(post.createdAt)}
                {wasEdited && ` · updated ${formatDate(post.updatedAt)}`}
              </p>
            </div>
          </div>

          {canManage && (
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link to={`/posts/${post.slug}/edit`}>
                  <Pencil /> Edit
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={() => setConfirmOpen(true)}>
                <Trash2 /> Delete
              </Button>
            </div>
          )}
        </div>
      </header>

      <div className="text-lg leading-8 break-words whitespace-pre-wrap">{post.content}</div>

      <Separator />
      <CommentSection postId={post._id} />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete this post?"
        description="The post will be removed from the site. An administrator can restore it later."
        confirmLabel="Delete post"
        destructive
        onConfirm={handleDelete}
      />
    </article>
  )
}
