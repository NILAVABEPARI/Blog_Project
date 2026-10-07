import { LoaderCircle } from 'lucide-react'

export default function PageLoader({ label = 'Loading...' }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground">
      <LoaderCircle className="size-6 animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  )
}
