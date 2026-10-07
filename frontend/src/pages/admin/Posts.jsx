import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { RotateCcw, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import DataState from '@/components/common/DataState'
import Pagination from '@/components/common/Pagination'
import { useDebounce } from '@/hooks/useDebounce'
import { fetchAdminPosts, purgePost, restorePost, softDeletePost } from '@/store/slices/adminSlice'
import { formatDate } from '@/lib/utils'

export default function Posts() {
  const dispatch = useDispatch()
  const { items, meta, status, error } = useSelector((s) => s.admin.posts)

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('active')
  const [confirm, setConfirm] = useState(null) // { type: 'delete' | 'purge', post }
  const debouncedSearch = useDebounce(search)

  const load = () => dispatch(fetchAdminPosts({ page, limit: 10, status: filter, search: debouncedSearch || undefined }))

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filter, debouncedSearch])

  const run = async (action, message) => {
    try {
      await dispatch(action).unwrap()
      toast.success(message)
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleConfirm = async () => {
    const { type, post } = confirm
    await run(type === 'purge' ? purgePost(post._id) : softDeletePost(post._id), type === 'purge' ? 'Post permanently deleted' : 'Post deleted')
    setConfirm(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Posts</h1>
        <p className="text-sm text-muted-foreground">Moderate every post, including soft-deleted ones.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Search by title..."
            className="pl-9"
          />
        </div>
        <Select
          value={filter}
          onValueChange={(v) => {
            setFilter(v)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="deleted">Deleted</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataState status={status} error={error} isEmpty={items.length === 0} emptyTitle="No posts found" onRetry={load}>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="pr-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((post) => (
                <TableRow key={post._id}>
                  <TableCell className="max-w-xs pl-4">
                    {post.isDeleted ? (
                      <span className="block truncate text-muted-foreground line-through">{post.title}</span>
                    ) : (
                      <Link to={`/posts/${post.slug}`} className="block truncate font-medium hover:underline">
                        {post.title}
                      </Link>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{post.author?.name || 'Deleted user'}</TableCell>
                  <TableCell>
                    <Badge variant={post.isDeleted ? 'destructive' : 'secondary'}>{post.isDeleted ? 'Deleted' : 'Active'}</Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(post.createdAt)}</TableCell>
                  <TableCell className="pr-4">
                    <div className="flex justify-end gap-2">
                      {post.isDeleted ? (
                        <>
                          <Button variant="outline" size="sm" onClick={() => run(restorePost(post._id), 'Post restored')}>
                            <RotateCcw /> Restore
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setConfirm({ type: 'purge', post })}>
                            <Trash2 /> Purge
                          </Button>
                        </>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => setConfirm({ type: 'delete', post })}>
                          <Trash2 /> Delete
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <Pagination meta={meta} onPageChange={setPage} />
      </DataState>

      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={confirm?.type === 'purge' ? 'Permanently delete this post?' : 'Delete this post?'}
        description={
          confirm?.type === 'purge'
            ? 'The post and all of its comments will be erased forever.'
            : 'The post will be hidden from the site. You can restore it from the Deleted filter.'
        }
        confirmLabel={confirm?.type === 'purge' ? 'Delete forever' : 'Delete'}
        destructive
        onConfirm={handleConfirm}
      />
    </div>
  )
}
