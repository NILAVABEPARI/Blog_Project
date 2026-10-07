import { useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import PageLoader from '@/components/common/PageLoader'
import { bootstrapAuth } from '@/store/slices/authSlice'

/**
 * The backend redirects here after Google/Facebook sign-in, having set the refresh cookie.
 * We trade that cookie for an access token, so no token is ever visible in the URL.
 */
export default function OAuthCallback() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    dispatch(bootstrapAuth())
      .unwrap()
      .then(() => navigate('/', { replace: true }))
      .catch(() => navigate('/login?error=oauth_failed', { replace: true }))
  }, [dispatch, navigate])

  return <PageLoader label="Signing you in..." />
}
