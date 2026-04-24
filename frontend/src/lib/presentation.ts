import type { UserProfile } from '@/src/types/domain'

export function getProfileName(profile?: Partial<UserProfile> | null) {
  const fullName = [profile?.lastName, profile?.firstName]
    .filter(Boolean)
    .join(' ')
    .trim()
  return fullName || profile?.username || 'Learner'
}

export function getInitials(value: string) {
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0]?.toUpperCase() ?? '')
    .join('')
}

export function formatRelativeTime(input?: string) {
  if (!input) return 'just now'
  const target = new Date(input)
  if (Number.isNaN(target.getTime())) return input

  const diff = Date.now() - target.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`

  return target.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

export function extractMediaUrls(content?: string | null) {
  if (!content) return []

  const matches =
    content.match(/https?:\/\/[^\s]+/g)?.filter((item) => {
      const lower = item.toLowerCase()
      return (
        lower.includes('/file/media/download/') ||
        lower.endsWith('.png') ||
        lower.endsWith('.jpg') ||
        lower.endsWith('.jpeg') ||
        lower.endsWith('.webp') ||
        lower.endsWith('.gif')
      )
    }) ?? []

  return Array.from(new Set(matches))
}

export function stripMediaUrls(content?: string | null) {
  if (!content) return ''

  return content.replace(/https?:\/\/[^\s]+/g, '').trim()
}
