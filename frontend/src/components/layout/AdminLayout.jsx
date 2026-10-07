import { NavLink, Outlet } from 'react-router-dom'
import { Activity, LayoutDashboard, MessageSquare, FileText, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

const links = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/posts', label: 'Posts', icon: FileText },
  { to: '/admin/comments', label: 'Comments', icon: MessageSquare },
  { to: '/admin/activity', label: 'Activity', icon: Activity },
]

export default function AdminLayout() {
  return (
    <div className="grid gap-6 md:grid-cols-[200px_1fr]">
      <aside>
        <p className="mb-3 hidden px-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase md:block">
          Admin panel
        </p>
        <nav className="flex gap-1 overflow-x-auto md:flex-col">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors',
                  isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                )
              }
            >
              <Icon className="size-4" /> {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <section className="min-w-0">
        <Outlet />
      </section>
    </div>
  )
}
