'use client'

import { Camera, Globe, LoaderCircle, Save } from 'lucide-react'
import { useEffect, useState } from 'react'

import postApiRequest from '@/src/apiRequest/post'
import profileApiRequest from '@/src/apiRequest/profile'
import LanguageSelector from '@/src/components/LanguageSelector'
import PostCard from '@/src/components/PostCard'
import UserAvatar from '@/src/components/UserAvatar'
import { useAppContext } from '@/src/app/app-provider'
import { getProfileName } from '@/src/lib/presentation'
import { formatDuration } from '@/src/lib/study'
import type { UpdateProfileBodyType } from '@/src/schemaValidations/profile.schema'
import type { Post, StudyStats, UserProfile } from '@/src/types/domain'

type DraftProfile = {
  lastName: string
  firstName: string
  email: string
  dob: string
  city: string
}

const fieldLabels: Record<keyof DraftProfile, string> = {
  lastName: 'Last name',
  firstName: 'First name',
  email: 'Email',
  dob: 'Date of birth',
  city: 'City'
}

const toNullableValue = (value: string) => {
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : null
}

const buildUpdatePayload = (draft: DraftProfile): UpdateProfileBodyType => ({
  lastName: toNullableValue(draft.lastName),
  firstName: toNullableValue(draft.firstName),
  email: toNullableValue(draft.email),
  dob: draft.dob || null,
  city: toNullableValue(draft.city)
})

type ProfilePageClientProps = {
  initialProfile: UserProfile | null
  initialPosts: Post[]
  initialStudyStats: StudyStats
}

export default function ProfilePageClient({
  initialProfile,
  initialPosts,
  initialStudyStats
}: ProfilePageClientProps) {
  const { profile, setProfile, refreshProfile } = useAppContext()
  const [draft, setDraft] = useState<DraftProfile>({
    lastName: '',
    firstName: '',
    email: '',
    dob: '',
    city: ''
  })
  const [editingField, setEditingField] = useState<keyof DraftProfile | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [errorMessage, setErrorMessage] = useState('')
  const [studyInsights] = useState<StudyStats>(initialStudyStats)

  useEffect(() => {
    const currentProfile = profile ?? initialProfile
    if (!currentProfile) {
      void refreshProfile()
      return
    }

    setDraft({
      lastName: currentProfile.lastName ?? '',
      firstName: currentProfile.firstName ?? '',
      email: currentProfile.email ?? '',
      dob: currentProfile.dob ?? '',
      city: currentProfile.city ?? ''
    })
  }, [profile, initialProfile, refreshProfile])

  const currentProfile = profile ?? initialProfile
  const profileName = getProfileName(currentProfile)

  const saveField = async () => {
    setIsSaving(true)
    setErrorMessage('')

    try {
      const response = await profileApiRequest.updateMyProfile(
        buildUpdatePayload(draft)
      )
      setProfile(response.payload.result)
      setEditingField(null)
    } catch {
      setErrorMessage('Unable to save this field right now.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarChange = async (file?: File | null) => {
    if (!file) return

    setIsSaving(true)
    setErrorMessage('')

    try {
      const response = await profileApiRequest.updateAvatar(file)
      setProfile(response.payload.result)
    } catch {
      setErrorMessage('Unable to upload avatar right now.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-muted/50 px-4 py-6">
      <div className="mx-auto w-full max-w-4xl space-y-4">
        <section className="panel-card p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <UserAvatar
                src={currentProfile?.avatar}
                name={profileName}
                className="size-16"
                fallbackClassName="bg-foreground text-background"
              />
              <div>
                <h1 className="text-2xl font-bold text-foreground">{profileName}</h1>
                <p className="text-sm text-muted-foreground">
                  @{currentProfile?.username ?? 'learner'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <LanguageSelector />
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border bg-card px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent">
                <Camera className="size-4" />
                Change avatar
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => handleAvatarChange(event.target.files?.[0])}
                />
              </label>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="panel-card p-5">
            <p className="text-sm text-muted-foreground">Total hours</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {formatDuration(studyInsights.totalSeconds)}
            </p>
          </div>
          <div className="panel-card p-5">
            <p className="text-sm text-muted-foreground">This week</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {formatDuration(studyInsights.weekSeconds)}
            </p>
          </div>
          <div className="panel-card p-5">
            <p className="text-sm text-muted-foreground">Streak</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {studyInsights.streakDays} days
            </p>
          </div>
        </section>

        <section className="panel-card p-6">
          <h2 className="text-xl font-semibold text-foreground">Personal information</h2>

          {errorMessage ? (
            <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {errorMessage}
            </div>
          ) : null}

          <div className="mt-5 divide-y overflow-hidden rounded-xl border">
            {(Object.keys(fieldLabels) as (keyof DraftProfile)[]).map((field) => {
              const isEditing = editingField === field
              const value = draft[field]
              const type =
                field === 'dob' ? 'date' : field === 'email' ? 'email' : 'text'

              return (
                <div
                  key={field}
                  className="flex flex-col gap-3 bg-card px-5 py-4 md:flex-row md:items-center"
                >
                  <div className="w-full max-w-40 text-sm text-muted-foreground">
                    {fieldLabels[field]}
                  </div>

                  {isEditing ? (
                    <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
                      <input
                        type={type}
                        value={value}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            [field]: event.target.value
                          }))
                        }
                        className="h-10 flex-1 rounded-lg border bg-background px-3 text-sm outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => void saveField()}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <LoaderCircle className="size-4 animate-spin" />
                        ) : (
                          <Save className="size-4" />
                        )}
                        Save
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditingField(field)}
                      className="flex flex-1 items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-accent"
                    >
                      <span className={value ? 'text-foreground' : 'text-muted-foreground/50'}>
                        {value || 'Not set yet'}
                      </span>
                      <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground/50">
                        Edit
                      </span>
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        <section className="panel-card overflow-hidden">
          <div className="border-b px-5 py-4">
            <h2 className="text-xl font-semibold text-foreground">Your posts</h2>
          </div>

          {posts.length > 0 ? (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                author={currentProfile}
                onShared={(sharedPost) =>
                  setPosts((current) => [sharedPost, ...current])
                }
              />
            ))
          ) : (
            <div className="px-5 py-8 text-sm text-muted-foreground">
              You have not posted anything yet.
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
