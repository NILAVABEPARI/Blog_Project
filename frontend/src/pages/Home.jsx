import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import { FileText, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Pagination from '@/components/common/Pagination'
import EmptyState from '@/components/common/EmptyState'
import ErrorMessage from '@/components/common/ErrorMessage'
import PostCard from '@/components/posts/PostCard'
import { Skeleton } from '@/components/ui/skeleton'
import { useDebounce } from '@/hooks/useDebounce'
import { fetchPosts } from '@/store/slices/postsSlice'

const PAGE_SIZE = 9

export default function Home() {
  const dispatch = useDispatch()
  const { items, meta, status, error } = useSelector((s) => s.posts.list)
  const [searchParams, setSearchParams] = useSearchParams()

  const page = Number(searchParams.get('page')) || 1
  const sort = searchParams.get('sort') || 'newest'
  const urlSearch = searchParams.get('search') || ''

  const [searchInput, setSearchInput] = useState(urlSearch)
  const debouncedSearch = useDebounce(searchInput)

  const updateParams = (changes) => {
    const next = new URLSearchParams(searchParams)
    Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)))
    setSearchParams(next)
  }

  // Push the debounced search term into the URL (and reset to page 1)
  useEffect(() => {
    if (debouncedSearch !== urlSearch) updateParams({ search: debouncedSearch, page: '' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  const load = () => dispatch(fetchPosts({ page, limit: PAGE_SIZE, sort, search: urlSearch || undefined }))

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sort, urlSearch])

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Latest stories</h1>
        <p className="text-muted-foreground">Read what the community is writing about.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search posts..."
            className="pl-9"
          />
        </div>
        <Select value={sort} onValueChange={(value) => updateParams({ sort: value, page: '' })}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {status === 'failed' ? (
        <ErrorMessage message={error} onRetry={load} />
      ) : status === 'loading' && items.length === 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No posts found"
          description={urlSearch ? `Nothing matched "${urlSearch}".` : 'Be the first to publish something.'}
        />
      ) : (
        <div className={status === 'loading' ? 'opacity-60 transition-opacity' : ''}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((post) => (
              <div key={post._id} className="relative">
                <PostCard post={post} />
              </div>
            ))}
          </div>
          <Pagination meta={meta} onPageChange={(p) => updateParams({ page: p > 1 ? String(p) : '' })} />
        </div>
      )}
    </div>
  )
}
