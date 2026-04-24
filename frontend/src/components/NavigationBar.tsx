'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

import authApiRequest from '@/src/apiRequest/auth'
import { useAppContext } from '@/src/app/app-provider'
import ChatDock from '@/src/components/ChatDock'
import { ModeToggle } from '@/src/components/ui/mode-toggle'
import { getInitials, getProfileName } from '@/src/lib/presentation'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/study', label: 'Study' },
  { href: '/global', label: 'Global' },
  { href: '/house', label: 'House' },
  { href: '/village', label: 'Village' },
  { href: '/league', label: 'League' },
  { href: '/chat', label: 'Chat' }
]

export default function NavigationBar() {
  const pathname = usePathname()
  const router = useRouter()
  const { profile, logoutLocal, isReady } = useAppContext()

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register')
  if (isAuthPage) return null

  const handleLogout = async () => {
    try {
      await authApiRequest.logoutClient()
    } finally {
      logoutLocal()
      router.push('/login')
      router.refresh()
    }
  }

  const profileName = getProfileName(profile)
  const initials = getInitials(profileName)

  if (!isReady) {
    return (
      <nav className="sticky top-0 z-50 flex h-14 items-center border-b bg-white px-6 shadow-sm">
        <div className="h-8 w-32 animate-pulse rounded bg-gray-100" />
      </nav>
    )
  }

  return (
    <nav className="sticky top-0 z-50 flex h-14 items-center border-b bg-white px-6 shadow-sm">
      <div className="flex items-center">
        <Link href="/">
          <img
            src="/flath-logo.png"
            alt="Flath logo"
            className="h-8 w-auto cursor-pointer transition-opacity hover:opacity-80"
          />
        </Link>
      </div>

      <div className="ml-10 flex flex-grow items-center gap-6 overflow-x-auto text-sm font-medium text-gray-700">
        {navLinks.map((link) => {
          const isActive =
            pathname === link.href ||
            (link.href !== '/' && pathname.startsWith(link.href))

          return (
            <Link
              key={link.href}
              href={link.href}
              className={isActive ? 'text-blue-600' : 'hover:text-blue-600'}
            >
              {link.label}
            </Link>
          )
        })}
      </div>

      <div className="ml-4 flex items-center gap-3">
        {profile ? <ChatDock /> : null}
        <ModeToggle />
        <Link href="/me" className="flex items-center gap-2 text-sm text-gray-700">
          {profile?.avatar ? (
            <img
              src={profile.avatar}
              alt={profileName}
              className="h-8 w-8 rounded-full border object-cover"
            />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-full border bg-gray-100 text-xs font-semibold text-gray-700">
              {initials}
            </span>
          )}
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="text-sm font-medium text-gray-700 hover:text-blue-600"
        >
          Sign out
        </button>
      </div>
    </nav>
  )
}
