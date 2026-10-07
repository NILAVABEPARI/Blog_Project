import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export const formatDate = (value, withTime = false) => {
  if (!value) return ''
  return new Date(value).toLocaleString(
    undefined,
    withTime
      ? { dateStyle: 'medium', timeStyle: 'short' }
      : { year: 'numeric', month: 'short', day: 'numeric' }
  )
}

export const getInitials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('') || '?'
