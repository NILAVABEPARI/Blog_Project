import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import DataState from '@/components/common/DataState'
import Pagination from '@/components/common/Pagination'
import { useDebounce } from '@/hooks/useDebounce'
import { deleteUser, fetchUsers, updateUser } from '@/store/slices/adminSlice'
import { selectUser } from '@/store/slices/authSlice'
import { formatDate } from '@/lib/utils'

export default function Users() {
  const dispatch = useDispatch()
  const me = useSelector(selectUser)
  const { items, meta, status, error } = useSelector((s) => s.admin.users)

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('all')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const debouncedSearch = useDebounce(search)

  const load = () =>
    dispatch(fetchUsers({ page, limit: 10, search: debouncedSearch || undefined, role: role === 'all' ? undefined : role }))

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch, role])

  const run = async (action, successMessage) => {
    try {
      await dispatch(action).unwrap()
      toast.success(successMessage)
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleDelete = async () => {
    await run(deleteUser(deleteTarget._id), 'User deleted')
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground">Change roles, deactivate or remove accounts.</p>
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
            placeholder="Search by name or email..."
            className="pl-9"
          />
        </div>
        <Select
          value={role}
          onValueChange={(v) => {
            setRole(v)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
            <SelectItem value="user">Users</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataState status={status} error={error} isEmpty={items.length === 0} emptyTitle="No users found" onRetry={load}>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="pr-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((u) => {
                const isSelf = u._id === me._id
                return (
                  <TableRow key={u._id}>
                    <TableCell className="pl-4">
                      <p className="font-medium">
                        {u.name} {isSelf && <span className="text-xs text-muted-foreground">(you)</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>{u.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={u.isActive}
                        disabled={isSelf}
                        aria-label={`Toggle ${u.name} active`}
                        onCheckedChange={(checked) =>
                          run(updateUser({ id: u._id, data: { isActive: checked } }), checked ? 'User activated' : 'User deactivated')
                        }
                      />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(u.createdAt)}</TableCell>
                    <TableCell className="pr-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isSelf}
                          onClick={() =>
                            run(
                              updateUser({ id: u._id, data: { role: u.role === 'admin' ? 'user' : 'admin' } }),
                              u.role === 'admin' ? 'Admin rights removed' : 'User promoted to admin'
                            )
                          }
                        >
                          {u.role === 'admin' ? 'Make user' : 'Make admin'}
                        </Button>
                        <Button variant="outline" size="icon" className="size-8" disabled={isSelf} onClick={() => setDeleteTarget(u)} aria-label={`Delete ${u.name}`}>
                          <Trash2 />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
        <Pagination meta={meta} onPageChange={setPage} />
      </DataState>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Delete ${deleteTarget?.name}?`}
        description="Their account and comments are removed and their posts are hidden (soft-deleted). This cannot be undone."
        confirmLabel="Delete user"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  )
}
