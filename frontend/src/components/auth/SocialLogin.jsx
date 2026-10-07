import { Button } from '@/components/ui/button'
import { API_URL } from '@/api/client'

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8z" />
    <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1.1.7-2.5 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24z" />
    <path fill="#FBBC05" d="M5.4 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.4a12 12 0 0 0 0 10.8l4-3.1z" />
    <path fill="#EA4335" d="M12 4.8c1.7 0 3.3.6 4.5 1.8l3.4-3.4A12 12 0 0 0 1.4 6.6l4 3.1C6.3 6.9 8.9 4.8 12 4.8z" />
  </svg>
)

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
    <path
      fill="#1877F2"
      d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12h3.4l-.5 3.5h-2.9v8.4A12 12 0 0 0 24 12z"
    />
  </svg>
)

/**
 * Plain links, not fetch calls: OAuth needs a full-page redirect to the provider.
 * The backend finishes the flow, sets the refresh cookie and redirects to /oauth/callback.
 */
export default function SocialLogin() {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <Button asChild variant="outline">
        <a href={`${API_URL}/auth/google`}>
          <GoogleIcon /> Google
        </a>
      </Button>
      <Button asChild variant="outline">
        <a href={`${API_URL}/auth/facebook`}>
          <FacebookIcon /> Facebook
        </a>
      </Button>
    </div>
  )
}
