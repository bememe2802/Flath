'use client'

import { useState } from 'react'

import FeedComposer from '@/src/components/FeedComposer'
import PostCard from '@/src/components/PostCard'
import { useAppContext } from '@/src/app/app-provider'
import type { Post } from '@/src/types/domain'

type HomePageClientProps = {
  initialPosts: Post[]
}

export default function HomePageClient({
  initialPosts
}: HomePageClientProps) {
  const { profile } = useAppContext()
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [feedError] = useState('')

  const mergeCurrentProfile = (post: Post): Post => ({
    ...post,
    username: profile?.username || post.username,
    firstName: profile?.firstName ?? post.firstName,
    lastName: profile?.lastName ?? post.lastName,
    avatar: profile?.avatar ?? post.avatar,
    city: profile?.city ?? post.city
  })

  return (
    <main className="min-h-screen bg-background px-4 pb-10 pt-6">
      <div className="mx-auto w-full max-w-4xl space-y-4">
        <FeedComposer
          onPosted={(createdPost) => {
            setPosts((current) => [mergeCurrentProfile(createdPost), ...current])
          }}
        />

        <section className="panel-card overflow-hidden">
          {feedError ? (
            <div className="p-6 text-sm text-destructive">{feedError}</div>
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
              <p className="text-lg font-semibold text-foreground">
                The feed is empty for now.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Publish the first study update and it will appear here at the top.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
