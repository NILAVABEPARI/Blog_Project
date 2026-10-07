import { Skeleton } from '@/components/ui/skeleton'
import ErrorMessage from './ErrorMessage'
import EmptyState from './EmptyState'

/**
 * Renders the right UI for a list slice: skeleton on first load, error, empty state, or the children.
 * Keeps showing the previous rows (dimmed) while a new page is loading.
 */
export default function DataState({ status, error, isEmpty, emptyTitle = 'Nothing here yet', emptyDescription, onRetry, children }) {
  if (status === 'failed') return <ErrorMessage message={error} onRetry={onRetry} />
  if (status === 'loading' && isEmpty) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }
  if (isEmpty && status === 'succeeded') return <EmptyState title={emptyTitle} description={emptyDescription} />
  return <div className={status === 'loading' ? 'opacity-60 transition-opacity' : ''}>{children}</div>
}
