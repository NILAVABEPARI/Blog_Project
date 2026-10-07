import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { FileText, Pencil, PenLine, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import DataState from '@/components/common/DataState'
import Pagination from '@/components/common/Pagination'
import { deletePost, fetchMyPosts } from '@/store/slices/postsSlice'
import { selectUser } from '@/store/slices/authSlice'
import { formatDate } from '@/lib/utils'

export default function MyPosts() {
  const dispatch = useDispatch()
  const user = useSelector(selectUser)
  const { items, meta, status, error } = useSelector((s) => s.posts.mine)
  const [page, setPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = () => dispatch(fetchMyPosts({ author: user._id, page, limit: 10 }))

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, user._id])

  const handleDelete = async () => {
    try {
      await dispatch(deletePost(deleteTarget)).unwrap()
      toast.success('Post deleted')
      // If that emptied the page, go back one
      if (items.length === 1 && page > 1) setPage(page - 1)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setDeleteTarget(null)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">My posts</h1>
        <Button asChild>
          <Link to="/posts/new">
            <PenLine /> New post
          </Link>
        </Button>
      </div>

      <DataState
        status={status}
        error={error}
        isEmpty={items.length === 0}
        emptyTitle="You have not written anything yet"
        emptyDescription="Your published posts will show up here."
        onRetry={load}
      >
        <div className="space-y-3">
          {items.map((post) => (
            <Card key={post._id} className="py-4">
              <CardContent className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <Link to={`/posts/${post.slug}`} className="block truncate font-medium hover:underline">
                    {post.title}
                  </Link>
                  <p className="text-sm text-muted-foreground">{formatDate(post.createdAt)}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/posts/${post.slug}/edit`}>
                      <Pencil /> Edit
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setDeleteTarget(post._id)}>
                    <Trash2 /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Pagination meta={meta} onPageChange={setPage} />
      </DataState>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this post?"
        description="It will disappear from the site. An administrator can restore it."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  )
}
