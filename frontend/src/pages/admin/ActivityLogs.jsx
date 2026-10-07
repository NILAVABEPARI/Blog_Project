import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import DataState from '@/components/common/DataState'
import Pagination from '@/components/common/Pagination'
import { fetchActivityLogs } from '@/store/slices/adminSlice'
import { formatDate } from '@/lib/utils'

export default function ActivityLogs() {
  const dispatch = useDispatch()
  const { items, meta, status, error } = useSelector((s) => s.admin.logs)
  const [page, setPage] = useState(1)

  const load = () => dispatch(fetchActivityLogs({ page, limit: 15 }))

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Activity log</h1>
        <p className="text-sm text-muted-foreground">Logins, post creation, deletions and admin actions.</p>
      </div>

      <DataState status={status} error={error} isEmpty={items.length === 0} emptyTitle="No activity recorded yet" onRetry={load}>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">When</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead className="pr-4">IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((log) => (
                <TableRow key={log._id}>
                  <TableCell className="pl-4 whitespace-nowrap text-muted-foreground">{formatDate(log.createdAt, true)}</TableCell>
                  <TableCell>
                    {log.user ? (
                      <>
                        <p className="font-medium">{log.user.name}</p>
                        <p className="text-xs text-muted-foreground">{log.user.email}</p>
                      </>
                    ) : (
                      <span className="text-muted-foreground">Unknown / deleted</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.action}</Badge>
                  </TableCell>
                  <TableCell className="pr-4 text-muted-foreground">{log.ip || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <Pagination meta={meta} onPageChange={setPage} />
      </DataState>
    </div>
  )
}
