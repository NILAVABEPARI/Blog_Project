import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { CircleAlert, LoaderCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import FieldError from '@/components/common/FieldError'
import SocialLogin from '@/components/auth/SocialLogin'
import { loginUser } from '@/store/slices/authSlice'
import { toFieldErrors } from '@/api/client'

export default function Login() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const loading = useSelector((s) => s.auth.status === 'loading')

  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(searchParams.get('error') === 'oauth_failed' ? 'Social login failed. Please try again.' : '')

  const from = location.state?.from?.pathname || '/'
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const found = {}
    if (!form.email.trim()) found.email = 'Email is required'
    if (!form.password) found.password = 'Password is required'
    setErrors(found)
    setFormError('')
    if (Object.keys(found).length) return

    try {
      const { user } = await dispatch(loginUser({ email: form.email.trim(), password: form.password })).unwrap()
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`)
      navigate(from, { replace: true })
    } catch (err) {
      setErrors(toFieldErrors(err))
      setFormError(err.message)
    }
  }

  return (
    <div className="mx-auto max-w-md pt-8">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>Log in to write posts and join the conversation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {formError && (
            <Alert variant="destructive">
              <CircleAlert />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" value={form.email} onChange={set('email')} aria-invalid={!!errors.email} />
              <FieldError message={errors.email} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={form.password}
                onChange={set('password')}
                aria-invalid={!!errors.password}
              />
              <FieldError message={errors.password} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <LoaderCircle className="animate-spin" />} Log in
            </Button>
          </form>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <Separator className="flex-1" /> OR CONTINUE WITH <Separator className="flex-1" />
          </div>
          <SocialLogin />

          <p className="text-center text-sm text-muted-foreground">
            New here?{' '}
            <Link to="/register" className="font-medium text-foreground underline underline-offset-4">
              Create an account
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
