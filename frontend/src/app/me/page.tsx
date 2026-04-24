'use client'

import { Camera, LoaderCircle, Save } from 'lucide-react'
import { useEffect, useState } from 'react'

import postApiRequest from '@/src/apiRequest/post'
import profileApiRequest from '@/src/apiRequest/profile'
import studyApiRequest from '@/src/apiRequest/study'
import { useAppContext } from '@/src/app/app-provider'
import PostCard from '@/src/components/PostCard'
import UserAvatar from '@/src/components/UserAvatar'
import { getProfileName } from '@/src/lib/presentation'
import { buildEmptyStudyStats, formatDuration } from '@/src/lib/study'
import type { UpdateProfileBodyType } from '@/src/schemaValidations/profile.schema'
import type { Post, StudyStats } from '@/src/types/domain'

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

export default function ProfilePage() {
  const { profile, setProfile, refreshProfile, isReady } = useAppContext()
  const [draft, setDraft] = useState<DraftProfile>({
    lastName: '',
    firstName: '',
    email: '',
    dob: '',
    city: ''
  })
  const [editingField, setEditingField] = useState<keyof DraftProfile | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [posts, setPosts] = useState<Post[]>([])
  const [errorMessage, setErrorMessage] = useState('')
  const [studyInsights, setStudyInsights] = useState<StudyStats>(
    buildEmptyStudyStats()
  )

  useEffect(() => {
    if (!profile) {
      void refreshProfile()
      return
    }

    setDraft({
      lastName: profile.lastName ?? '',
      firstName: profile.firstName ?? '',
      email: profile.email ?? '',
      dob: profile.dob ?? '',
      city: profile.city ?? ''
    })
  }, [profile])

  useEffect(() => {
    if (!isReady) return

    void Promise.all([
      postApiRequest
        .myPosts(1, 50)
        .then((response) => setPosts(response.payload.result.data))
        .catch(() => undefined),
      studyApiRequest
        .myStats()
        .then((response) => setStudyInsights(response.payload.result))
        .catch(() => undefined)
    ])
  }, [isReady])

  const profileName = getProfileName(profile)

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
    <main className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="mx-auto w-full max-w-4xl space-y-4">
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <UserAvatar
                src={profile?.avatar}
                name={profileName}
                className="size-16"
                fallbackClassName="bg-gray-900 text-white"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{profileName}</h1>
                <p className="text-sm text-gray-500">@{profile?.username ?? 'learner'}</p>
              </div>
            </div>

            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
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
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Total hours</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {formatDuration(studyInsights.totalSeconds)}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">This week</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {formatDuration(studyInsights.weekSeconds)}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Streak</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {studyInsights.streakDays} days
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">Personal information</h2>

          {errorMessage ? (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {errorMessage}
            </div>
          ) : null}

          <div className="mt-5 divide-y divide-gray-200 overflow-hidden rounded-xl border border-gray-200">
            {(Object.keys(fieldLabels) as (keyof DraftProfile)[]).map((field) => {
              const isEditing = editingField === field
              const value = draft[field]
              const type =
                field === 'dob' ? 'date' : field === 'email' ? 'email' : 'text'

              return (
                <div
                  key={field}
                  className="flex flex-col gap-3 bg-white px-5 py-4 md:flex-row md:items-center"
                >
                  <div className="w-full max-w-40 text-sm text-gray-500">
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
                        className="h-10 flex-1 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => void saveField()}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
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
                      className="flex flex-1 items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-gray-50"
                    >
                      <span className={value ? 'text-gray-900' : 'text-gray-400'}>
                        {value || 'Not set yet'}
                      </span>
                      <span className="text-xs font-medium uppercase tracking-[0.14em] text-gray-400">
                        Edit
                      </span>
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="text-xl font-semibold text-gray-900">Your posts</h2>
          </div>

          {posts.length > 0 ? (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                author={profile}
                onShared={(sharedPost) =>
                  setPosts((current) => [sharedPost, ...current])
                }
              />
            ))
          ) : (
            <div className="px-5 py-8 text-sm text-gray-500">
              You have not posted anything yet.
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
