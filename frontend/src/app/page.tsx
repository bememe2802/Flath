'use client'

import { LoaderCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

import newsfeedApiRequest from '@/src/apiRequest/newsfeed'
import studyApiRequest from '@/src/apiRequest/study'
import { useAppContext } from '@/src/app/app-provider'
import FeedComposer from '@/src/components/FeedComposer'
import PostCard from '@/src/components/PostCard'
import { buildEmptyStudyStats, formatDuration } from '@/src/lib/study'
import type { Post, StudyStats } from '@/src/types/domain'

export default function HomePage() {
  const { profile, isReady } = useAppContext()
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [feedError, setFeedError] = useState('')
  const [studyInsights, setStudyInsights] = useState<StudyStats>(
    buildEmptyStudyStats()
  )

  const mergeCurrentProfile = (post: Post): Post => ({
    ...post,
    username: profile?.username || post.username,
    firstName: profile?.firstName ?? post.firstName,
    lastName: profile?.lastName ?? post.lastName,
    avatar: profile?.avatar ?? post.avatar,
    city: profile?.city ?? post.city
  })

  useEffect(() => {
    async function bootstrap() {
      setIsLoading(true)
      setFeedError('')

      try {
        const [feedRes, statsRes] = await Promise.all([
          newsfeedApiRequest.feed(1, 30),
          studyApiRequest.myStats().catch(() => null)
        ])

        setPosts(feedRes.payload.result.data)
        setStudyInsights(statsRes?.payload.result ?? buildEmptyStudyStats())
      } catch {
        setFeedError('Unable to load your feed right now.')
      } finally {
        setIsLoading(false)
      }
    }

    if (isReady) {
      void bootstrap()
    }
  }, [isReady])

  return (
    <main className="min-h-screen bg-white px-4 pb-10 pt-6">
      <div className="mx-auto w-full max-w-4xl space-y-4">
        <FeedComposer
          onPosted={(createdPost) => {
            setPosts((current) => [mergeCurrentProfile(createdPost), ...current])
          }}
        />

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {isLoading ? (
            <div className="flex min-h-60 items-center justify-center">
              <LoaderCircle className="size-6 animate-spin text-gray-400" />
            </div>
          ) : feedError ? (
            <div className="p-6 text-sm text-red-600">
              {feedError}
            </div>
          ) : posts.length > 0 ? (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onShared={(sharedPost) =>
                  setPosts((current) => [mergeCurrentProfile(sharedPost), ...current])
                }
              />
            ))
          ) : (
            <div className="py-10 text-center">
              <p className="text-lg font-semibold text-slate-900">
                The feed is empty for now.
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Publish the first study update and it will appear here at the top.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
