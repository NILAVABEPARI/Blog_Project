import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { Route, Routes } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import AdminLayout from '@/components/layout/AdminLayout'
import { AdminRoute, GuestRoute, ProtectedRoute } from '@/components/routing/guards'
import { bootstrapAuth } from '@/store/slices/authSlice'

import Home from '@/pages/Home'
import PostDetail from '@/pages/PostDetail'
import PostEditor from '@/pages/PostEditor'
import MyPosts from '@/pages/MyPosts'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import OAuthCallback from '@/pages/OAuthCallback'
import NotFound from '@/pages/NotFound'
import Dashboard from '@/pages/admin/Dashboard'
import Users from '@/pages/admin/Users'
import Posts from '@/pages/admin/Posts'
import Comments from '@/pages/admin/Comments'
import ActivityLogs from '@/pages/admin/ActivityLogs'

export default function App() {
  const dispatch = useDispatch()

  // On first load, try to restore the session from the httpOnly refresh cookie
  useEffect(() => {
    dispatch(bootstrapAuth())
  }, [dispatch])

  return (
    <Routes>
      <Route element={<Layout />}>
        {/* public */}
        <Route index element={<Home />} />
        <Route path="posts/:slug" element={<PostDetail />} />
        <Route path="oauth/callback" element={<OAuthCallback />} />

        {/* guests only */}
        <Route element={<GuestRoute />}>
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
        </Route>

        {/* signed-in users */}
        <Route element={<ProtectedRoute />}>
          <Route path="posts/new" element={<PostEditor />} />
          <Route path="posts/:slug/edit" element={<PostEditor />} />
          <Route path="my-posts" element={<MyPosts />} />
        </Route>

        {/* admins */}
        <Route element={<AdminRoute />}>
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="posts" element={<Posts />} />
            <Route path="comments" element={<Comments />} />
            <Route path="activity" element={<ActivityLogs />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
