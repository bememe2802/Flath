'use client'

import { ImagePlus, LoaderCircle, SendHorizonal, X } from 'lucide-react'
import { useRef, useState } from 'react'

import fileApiRequest from '@/src/apiRequest/file'
import postApiRequest from '@/src/apiRequest/post'
import { useAppContext } from '@/src/app/app-provider'
import { getProfileName } from '@/src/lib/presentation'
import type { Post } from '@/src/types/domain'

import UserAvatar from './UserAvatar'

type FeedComposerProps = {
  onPosted: (post: Post) => void
}

export default function FeedComposer({ onPosted }: FeedComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { profile } = useAppContext()
  const [content, setContent] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const profileName = getProfileName(profile)

  const handleSubmit = async () => {
    if (!content.trim() && !selectedFile) return

    setIsSubmitting(true)
    setErrorMessage('')

    try {
      let finalContent = content.trim()

      if (selectedFile) {
        const uploadRes = await fileApiRequest.upload(selectedFile)
        finalContent = [finalContent, uploadRes.payload.result.url]
          .filter(Boolean)
          .join('\n')
      }

      const createdPost = await postApiRequest.create({
        content: finalContent
      })

      onPosted(createdPost.payload.result)
      setContent('')
      setSelectedFile(null)
    } catch {
      setErrorMessage('Unable to share this study update right now.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="panel-card p-5">
      <div className="flex gap-3">
        <UserAvatar
          src={profile?.avatar}
          name={profileName}
          className="size-10"
          fallbackClassName="bg-foreground text-background"
        />

        <div className="min-w-0 flex-1 space-y-4">
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Write a study update..."
            className="min-h-24 w-full resize-none rounded-xl border bg-background px-4 py-3 text-sm leading-6 text-foreground outline-none transition focus:border-primary"
          />

          {selectedFile ? (
            <div className="flex items-center justify-between rounded-xl border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
              <span className="truncate">{selectedFile.name}</span>
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="rounded-full p-1 transition hover:bg-background"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : null}

          {errorMessage ? (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {errorMessage}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
              >
                <ImagePlus className="size-3.5" />
                Attach file
              </button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
              />
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || (!content.trim() && !selectedFile)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <SendHorizonal className="size-4" />
              )}
              Post
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
