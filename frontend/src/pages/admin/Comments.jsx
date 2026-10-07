import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import DataState from '@/components/common/DataState'
import Pagination from '@/components/common/Pagination'
import { deleteAdminComment, fetchAdminComments } from '@/store/slices/adminSlice'
import { formatDate } from '@/lib/utils'

export default function Comments() {
  const dispatch = useDispatch()
  const { items, meta, status, error } = useSelector((s) => s.admin.comments)
  const [page, setPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = () => dispatch(fetchAdminComments({ page, limit: 10 }))

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const handleDelete = async () => {
    try {
      await dispatch(deleteAdminComment(deleteTarget)).unwrap()
      toast.success('Comment deleted')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Comments</h1>
        <p className="text-sm text-muted-foreground">Every comment across the site, newest first.</p>
      </div>

      <DataState status={status} error={error} isEmpty={items.length === 0} emptyTitle="No comments yet" onRetry={load}>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Comment</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Post</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="pr-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((c) => (
                <TableRow key={c._id}>
                  <TableCell className="max-w-xs pl-4">
                    <p className="line-clamp-2 text-sm break-words">{c.content}</p>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.author?.name || 'Deleted user'}</TableCell>
                  <TableCell className="max-w-40">
                    {c.post ? (
                      <Link to={`/posts/${c.post.slug}`} className="block truncate hover:underline">
                        {c.post.title}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">Removed post</span>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(c.createdAt)}</TableCell>
                  <TableCell className="pr-4 text-right">
                    <Button variant="outline" size="icon" className="size-8" onClick={() => setDeleteTarget(c._id)} aria-label="Delete comment">
                      <Trash2 />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <Pagination meta={meta} onPageChange={setPage} />
      </DataState>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this comment?"
        description="This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  )
}
