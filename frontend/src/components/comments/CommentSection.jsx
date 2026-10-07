import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { LoaderCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import ErrorMessage from '@/components/common/ErrorMessage'
import FieldError from '@/components/common/FieldError'
import { addComment, editComment, fetchComments, removeComment, resetComments } from '@/store/slices/commentsSlice'
import { selectIsAdmin, selectUser } from '@/store/slices/authSlice'
import { formatDate, getInitials } from '@/lib/utils'
import { toFieldErrors } from '@/api/client'

const PAGE_SIZE = 10

export default function CommentSection({ postId }) {
  const dispatch = useDispatch()
  const user = useSelector(selectUser)
  const isAdmin = useSelector(selectIsAdmin)
  const { items, meta, status, error } = useSelector((s) => s.comments)

  const [content, setContent] = useState('')
  const [contentError, setContentError] = useState('')
  const [posting, setPosting] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editContent, setEditContent] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => {
    dispatch(fetchComments({ postId, page: 1, limit: PAGE_SIZE }))
    return () => {
      dispatch(resetComments())
    }
  }, [dispatch, postId])

  const canManage = (comment) => user && (comment.author?._id === user._id || isAdmin)

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!content.trim()) return setContentError('Comment cannot be empty')
    setContentError('')
    setPosting(true)
    try {
      await dispatch(addComment({ postId, content: content.trim() })).unwrap()
      setContent('')
    } catch (err) {
      setContentError(toFieldErrors(err).content || err.message)
    } finally {
      setPosting(false)
    }
  }

  const handleSaveEdit = async (id) => {
    if (!editContent.trim()) return toast.error('Comment cannot be empty')
    try {
      await dispatch(editComment({ id, content: editContent.trim() })).unwrap()
      setEditingId(null)
      toast.success('Comment updated')
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleDelete = async () => {
    try {
      await dispatch(removeComment(deleteTarget)).unwrap()
      toast.success('Comment deleted')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setDeleteTarget(null)
    }
  }

  return (
    <section className="space-y-6" aria-labelledby="comments-heading">
      <h2 id="comments-heading" className="text-xl font-semibold">
        Comments {meta ? `(${meta.total})` : ''}
      </h2>

      {user ? (
        <form onSubmit={handleAdd} className="space-y-3">
          <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Share your thoughts..." maxLength={1000} />
          <FieldError message={contentError} />
          <Button type="submit" size="sm" disabled={posting}>
            {posting && <LoaderCircle className="animate-spin" />} Post comment
          </Button>
        </form>
      ) : (
        <p className="rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          <Link to="/login" className="font-medium text-foreground underline underline-offset-4">
            Log in
          </Link>{' '}
          to join the conversation.
        </p>
      )}

      {status === 'failed' && (
        <ErrorMessage message={error} onRetry={() => dispatch(fetchComments({ postId, page: 1, limit: PAGE_SIZE }))} />
      )}

      <ul className="space-y-5">
        {items.map((comment) => {
          const name = comment.author?.name || 'Deleted user'
          const isEditing = editingId === comment._id
          return (
            <li key={comment._id} className="flex gap-3">
              <Avatar className="mt-0.5">
                {comment.author?.avatar && <AvatarImage src={comment.author.avatar} alt={name} />}
                <AvatarFallback>{getInitials(name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-sm font-medium">{name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(comment.createdAt, true)}
                    {comment.isEdited && ' · edited'}
                  </span>
                </div>

                {isEditing ? (
                  <div className="space-y-2">
                    <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} maxLength={1000} />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleSaveEdit(comment._id)}>
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm break-words whitespace-pre-wrap">{comment.content}</p>
                )}

                {!isEditing && canManage(comment) && (
                  <div className="flex gap-3 pt-1 text-xs">
                    {comment.author?._id === user._id && (
                      <button
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setEditingId(comment._id)
                          setEditContent(comment.content)
                        }}
                      >
                        Edit
                      </button>
                    )}
                    <button className="text-muted-foreground hover:text-destructive" onClick={() => setDeleteTarget(comment._id)}>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      {status === 'succeeded' && items.length === 0 && <p className="text-sm text-muted-foreground">No comments yet. Be the first!</p>}

      {meta?.hasNextPage && (
        <Button
          variant="outline"
          size="sm"
          disabled={status === 'loading'}
          onClick={() => dispatch(fetchComments({ postId, page: meta.page + 1, limit: PAGE_SIZE }))}
        >
          {status === 'loading' && <LoaderCircle className="animate-spin" />} Load more comments
        </Button>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this comment?"
        description="This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </section>
  )
}
