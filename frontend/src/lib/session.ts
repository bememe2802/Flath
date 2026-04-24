const PROFILE_STORAGE_KEY = 'flath.profile'

export const SESSION_COOKIE_KEY = 'sessionToken_client'

export function getCookie(name: string) {
  if (typeof document === 'undefined') return null
  return (
    document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${name}=`))
      ?.split('=')[1] ?? null
  )
}

export function hasSessionCookie() {
  return Boolean(getCookie(SESSION_COOKIE_KEY))
}

export function readStoredProfile<T>() {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    window.localStorage.removeItem(PROFILE_STORAGE_KEY)
    return null
  }
}

export function writeStoredProfile(value: unknown) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(value))
}

export function clearStoredProfile() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(PROFILE_STORAGE_KEY)
}
