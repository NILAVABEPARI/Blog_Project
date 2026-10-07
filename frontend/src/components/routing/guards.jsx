import { useSelector } from 'react-redux'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import PageLoader from '@/components/common/PageLoader'
import { selectAuthInitialized, selectIsAdmin, selectUser } from '@/store/slices/authSlice'

/** Logged-in users only. Remembers where the visitor was heading so login can send them back. */
export function ProtectedRoute() {
  const user = useSelector(selectUser)
  const initialized = useSelector(selectAuthInitialized)
  const location = useLocation()

  if (!initialized) return <PageLoader />
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  return <Outlet />
}

/** Admins only. The API enforces this too; this just keeps the UI honest. */
export function AdminRoute() {
  const user = useSelector(selectUser)
  const isAdmin = useSelector(selectIsAdmin)
  const initialized = useSelector(selectAuthInitialized)
  const location = useLocation()

  if (!initialized) return <PageLoader />
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  if (!isAdmin) return <Navigate to="/" replace />
  return <Outlet />
}

/** Login / register pages: signed-in users are sent home. */
export function GuestRoute() {
  const user = useSelector(selectUser)
  const initialized = useSelector(selectAuthInitialized)

  if (!initialized) return <PageLoader />
  if (user) return <Navigate to="/" replace />
  return <Outlet />
}
