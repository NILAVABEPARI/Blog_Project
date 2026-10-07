import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
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
import { registerUser } from '@/store/slices/authSlice'
import { toFieldErrors } from '@/api/client'

// Same rules as the backend
const validate = ({ name, email, password }) => {
  const errors = {}
  if (name.trim().length < 2) errors.name = 'Name must be at least 2 characters'
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) errors.email = 'Please provide a valid email'
  if (password.length < 8) errors.password = 'Password must be at least 8 characters'
  else if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password))
    errors.password = 'Use upper and lower case letters and a number'
  return errors
}

export default function Register() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const loading = useSelector((s) => s.auth.status === 'loading')

  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const found = validate(form)
    setErrors(found)
    setFormError('')
    if (Object.keys(found).length) return

    try {
      await dispatch(registerUser({ name: form.name.trim(), email: form.email.trim(), password: form.password })).unwrap()
      toast.success('Account created. Welcome!')
      navigate('/', { replace: true })
    } catch (err) {
      setErrors(toFieldErrors(err))
      setFormError(err.message)
    }
  }

  return (
    <div className="mx-auto max-w-md pt-8">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create your account</CardTitle>
          <CardDescription>Start writing in a minute</CardDescription>
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
              <Label htmlFor="name">Name</Label>
              <Input id="name" autoComplete="name" value={form.name} onChange={set('name')} aria-invalid={!!errors.name} />
              <FieldError message={errors.name} />
            </div>
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
                autoComplete="new-password"
                value={form.password}
                onChange={set('password')}
                aria-invalid={!!errors.password}
              />
              <FieldError message={errors.password} />
              {!errors.password && <p className="text-xs text-muted-foreground">At least 8 characters with upper and lower case letters and a number.</p>}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <LoaderCircle className="animate-spin" />} Create account
            </Button>
          </form>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <Separator className="flex-1" /> OR CONTINUE WITH <Separator className="flex-1" />
          </div>
          <SocialLogin />

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-foreground underline underline-offset-4">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
