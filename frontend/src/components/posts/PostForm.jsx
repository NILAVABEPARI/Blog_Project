import { useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import FieldError from '@/components/common/FieldError'
import ErrorMessage from '@/components/common/ErrorMessage'
import { toFieldErrors } from '@/api/client'

// Mirrors the backend Zod schema so most mistakes are caught before a request is made
const validate = ({ title, content }) => {
  const errors = {}
  const t = title.trim()
  const c = content.trim()
  if (t.length < 3) errors.title = 'Title must be at least 3 characters'
  else if (t.length > 150) errors.title = 'Title must be at most 150 characters'
  if (c.length < 10) errors.content = 'Content must be at least 10 characters'
  else if (c.length > 20000) errors.content = 'Content must be at most 20,000 characters'
  return errors
}

/** `onSubmit(values)` must return a promise that rejects with a normalized API error on failure. */
export default function PostForm({ initial = { title: '', content: '' }, submitLabel, onSubmit, onCancel }) {
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const set = (field) => (e) => setValues((v) => ({ ...v, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const found = validate(values)
    setErrors(found)
    setFormError('')
    if (Object.keys(found).length) return

    setSubmitting(true)
    try {
      await onSubmit({ title: values.title.trim(), content: values.content.trim() })
    } catch (err) {
      setErrors(toFieldErrors(err))
      setFormError(err?.message || 'Could not save the post')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {formError && <ErrorMessage title="Could not save" message={formError} />}

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" value={values.title} onChange={set('title')} placeholder="An interesting title" aria-invalid={!!errors.title} />
        <FieldError message={errors.title} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          value={values.content}
          onChange={set('content')}
          placeholder="Write your story..."
          className="min-h-72"
          aria-invalid={!!errors.content}
        />
        <div className="flex justify-between">
          <FieldError message={errors.content} />
          <span className="ml-auto text-xs text-muted-foreground">{values.content.length} / 20000</span>
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting && <LoaderCircle className="animate-spin" />} {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
