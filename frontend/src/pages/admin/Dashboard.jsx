import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { FileText, MessageSquare, Trash2, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import ErrorMessage from '@/components/common/ErrorMessage'
import { fetchStats } from '@/store/slices/adminSlice'

const cards = [
  { key: 'users', label: 'Total users', icon: Users },
  { key: 'posts', label: 'Total posts', icon: FileText },
  { key: 'comments', label: 'Total comments', icon: MessageSquare },
  { key: 'deletedPosts', label: 'Deleted posts', icon: Trash2 },
]

export default function Dashboard() {
  const dispatch = useDispatch()
  const { data, status, error } = useSelector((s) => s.admin.stats)

  useEffect(() => {
    dispatch(fetchStats())
  }, [dispatch])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">An overview of the whole site.</p>
      </div>

      {status === 'failed' && <ErrorMessage message={error} onRetry={() => dispatch(fetchStats())} />}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ key, label, icon: Icon }) => (
          <Card key={key} className="gap-2 py-5">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {data ? <p className="text-3xl font-bold">{data[key]}</p> : <Skeleton className="h-9 w-16" />}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
