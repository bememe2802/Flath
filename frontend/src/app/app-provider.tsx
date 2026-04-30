'use client'

import profileApiRequest from '@/src/apiRequest/profile'
import {
  clearStoredProfile,
  hasSessionCookie,
  readStoredProfile,
  writeStoredProfile
} from '@/src/lib/session'
import type { UserProfile } from '@/src/types/domain'
import { createContext, useContext, useEffect, useState } from 'react'

type AppContextValue = {
  profile: UserProfile | null
  isAuthenticated: boolean
  isReady: boolean
  setProfile: (profile: UserProfile | null) => void
  refreshProfile: () => Promise<UserProfile | null>
  logoutLocal: () => void
}

const AppContext = createContext<AppContextValue>({
  profile: null,
  isAuthenticated: false,
  isReady: false,
  setProfile: () => undefined,
  refreshProfile: async () => null,
  logoutLocal: () => undefined
})

export function useAppContext() {
  return useContext(AppContext)
}

export default function AppProvider({
  initialProfile = null,
  children
}: {
  initialProfile?: UserProfile | null
  children: React.ReactNode
}) {
  const [profile, setProfileState] = useState<UserProfile | null>(initialProfile)
  const [isReady, setIsReady] = useState(Boolean(initialProfile))

  const setProfile = (nextProfile: UserProfile | null) => {
    setProfileState(nextProfile)
    if (nextProfile) {
      writeStoredProfile(nextProfile)
    } else {
      clearStoredProfile()
    }
  }

  const refreshProfile = async () => {
    if (!hasSessionCookie()) {
      setProfile(null)
      return null
    }

    try {
      const { payload } = await profileApiRequest.getMyProfile()
      setProfile(payload.result)
      return payload.result
    } catch {
      setProfile(null)
      return null
    }
  }

  const logoutLocal = () => {
    setProfile(null)
  }

  useEffect(() => {
    if (initialProfile) {
      writeStoredProfile(initialProfile)
      setProfileState(initialProfile)
      setIsReady(true)
      return
    }

    const cachedProfile = readStoredProfile<UserProfile>()
    if (cachedProfile) {
      setProfileState(cachedProfile)
    }

    if (!hasSessionCookie()) {
      clearStoredProfile()
      setProfileState(null)
      setIsReady(true)
      return
    }

    refreshProfile().finally(() => setIsReady(true))
  }, [initialProfile])

  return (
    <AppContext.Provider
      value={{
        profile,
        isAuthenticated: Boolean(profile),
        isReady,
        setProfile,
        refreshProfile,
        logoutLocal
      }}
    >
      {children}
    </AppContext.Provider>
  )
}
