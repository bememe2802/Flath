'use client'

import {
  Heart,
  LoaderCircle,
  MessageCircle,
  Repeat2,
  SendHorizonal
} from 'lucide-react'
import { useEffect, useState } from 'react'

import postApiRequest from '@/src/apiRequest/post'
import {
  extractMediaUrls,
  formatRelativeTime,
  getProfileName,
  stripMediaUrls
} from '@/src/lib/presentation'
import type { Post, PostComment, UserProfile } from '@/src/types/domain'

import UserAvatar from './UserAvatar'

type PostCardProps = {
  post: Post
  author?: Partial<UserProfile> | null
  onShared?: (post: Post) => void
}

function isImageUrl(value: string) {
  const normalized = value.toLowerCase()
  return (
    normalized.endsWith('.png') ||
    normalized.endsWith('.jpg') ||
    normalized.endsWith('.jpeg') ||
    normalized.endsWith('.gif') ||
    normalized.endsWith('.webp') ||
    normalized.includes('/file/media/download/')
  )
}

function normalizePost(post: Post): Post {
  return {
    ...post,
    likeCount: post.likeCount ?? 0,
    commentCount: post.commentCount ?? 0,
    shareCount: post.shareCount ?? 0,
    likedByMe: post.likedByMe ?? false,
    sharedPostId: post.sharedPostId ?? null,
    sharedPost: post.sharedPost ? normalizePost(post.sharedPost) : null
  }
}

function PostBody({
  post,
  author,
  compact = false
}: {
  post: Post
  author?: Partial<UserProfile> | null
  compact?: boolean
}) {
  const mediaUrls = extractMediaUrls(post.content)
  const message =
    stripMediaUrls(post.content) ||
    (post.sharedPost ? 'Shared a post.' : 'Shared a study asset.')
  const firstName = author?.firstName ?? post.firstName
  const lastName = author?.lastName ?? post.lastName
  const username = author?.username ?? post.username
  const avatar = author?.avatar ?? post.avatar
  const city = author?.city ?? post.city
  const profileName = getProfileName({ firstName, lastName, username })

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      <div className="flex items-start gap-3">
        <UserAvatar
          src={avatar}
          name={profileName}
          className={compact ? 'size-9' : 'size-10'}
          fallbackClassName="bg-gray-900 text-white"
        />

        <div className="min-w-0 flex-1">
          <p className={compact ? 'font-medium text-gray-800' : 'font-semibold text-gray-800'}>
            {profileName}
          </p>
          <p className="text-sm text-gray-500">
            {formatRelativeTime(post.createdDate || post.created)}
            {username ? ` · @${username}` : ''}
            {city ? ` · ${city}` : ''}
          </p>
        </div>
      </div>

      <p className="whitespace-pre-wrap text-[15px] leading-7 text-gray-700">
        {message}
      </p>

      {mediaUrls.length > 0 ? (
        <div className="grid gap-3">
          {mediaUrls.map((url) =>
            isImageUrl(url) ? (
              <img
                key={url}
                src={url}
                alt="Post attachment"
                className="max-h-[420px] w-full rounded-xl border border-gray-200 object-cover"
              />
            ) : (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 transition hover:bg-gray-100"
              >
                Open attachment
              </a>
            )
          )}
        </div>
      ) : null}

      {post.sharedPost ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <PostBody post={post.sharedPost} compact />
        </div>
      ) : null}
    </div>
  )
}

function CommentItem({ comment }: { comment: PostComment }) {
  const profileName = getProfileName(comment)

  return (
    <div className="flex gap-3">
      <UserAvatar
        src={comment.avatar}
        name={profileName}
        className="size-8"
        fallbackClassName="bg-gray-900 text-white"
      />
      <div className="min-w-0 flex-1 rounded-xl bg-gray-50 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-800">{profileName}</span>
          <span className="text-xs text-gray-500">
            {formatRelativeTime(comment.createdDate || comment.created)}
          </span>
        </div>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-700">
          {comment.content}
        </p>
      </div>
    </div>
  )
}

export default function PostCard({ post, author, onShared }: PostCardProps) {
  const [postState, setPostState] = useState<Post>(() => normalizePost(post))
  const [comments, setComments] = useState<PostComment[]>([])
  const [commentDraft, setCommentDraft] = useState('')
  const [isCommentsOpen, setIsCommentsOpen] = useState(false)
  const [hasLoadedComments, setHasLoadedComments] = useState(false)
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [isTogglingLike, setIsTogglingLike] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [commentError, setCommentError] = useState('')
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    setPostState(normalizePost(post))
  }, [post])

  const loadComments = async () => {
    setIsLoadingComments(true)
    setCommentError('')

    try {
      const response = await postApiRequest.comments(postState.id)
      setComments(response.payload.result)
      setHasLoadedComments(true)
    } catch {
      setCommentError('Unable to load comments right now.')
    } finally {
      setIsLoadingComments(false)
    }
  }

  const handleToggleComments = async () => {
    const nextOpen = !isCommentsOpen
    setIsCommentsOpen(nextOpen)

    if (nextOpen && !hasLoadedComments && !isLoadingComments) {
      await loadComments()
    }
  }

  const handleLike = async () => {
    if (isTogglingLike) return

    setIsTogglingLike(true)
    setActionError('')

    try {
      const response = await postApiRequest.toggleLike(postState.id)
      setPostState((current) => ({
        ...current,
        likedByMe: response.payload.result.liked,
        likeCount: response.payload.result.likeCount
      }))
    } catch {
      setActionError('Unable to update this reaction right now.')
    } finally {
      setIsTogglingLike(false)
    }
  }

  const handleSubmitComment = async () => {
    const content = commentDraft.trim()
    if (!content || isSubmittingComment) return

    setIsSubmittingComment(true)
    setCommentError('')

    try {
      const response = await postApiRequest.comment(postState.id, { content })
      setComments((current) => [...current, response.payload.result])
      setCommentDraft('')
      setHasLoadedComments(true)
      setIsCommentsOpen(true)
      setPostState((current) => ({
        ...current,
        commentCount: current.commentCount + 1
      }))
    } catch {
      setCommentError('Unable to post your comment right now.')
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const handleShare = async () => {
    if (isSharing) return

    setIsSharing(true)
    setActionError('')

    try {
      const response = await postApiRequest.share(postState.id, {})
      setPostState((current) => ({
        ...current,
        shareCount: current.shareCount + 1
      }))
      onShared?.(response.payload.result)
    } catch {
      setActionError('Unable to share this post right now.')
    } finally {
      setIsSharing(false)
    }
  }

  const totalEngagement =
    postState.likeCount + postState.commentCount + postState.shareCount

  return (
    <article className="border-b border-gray-200 px-5 py-5 first:pt-5 last:border-b-0">
      <PostBody post={postState} author={author} />

      {totalEngagement > 0 ? (
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-500">
          <span>{postState.likeCount} likes</span>
          <span>{postState.commentCount} comments</span>
          <span>{postState.shareCount} shares</span>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4 text-sm">
        <button
          type="button"
          onClick={() => void handleLike()}
          disabled={isTogglingLike}
          className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 transition ${
            postState.likedByMe
              ? 'bg-red-50 text-red-600'
              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
          }`}
        >
          {isTogglingLike ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Heart
              className={`size-4 ${postState.likedByMe ? 'fill-current' : ''}`}
            />
          )}
          Like
        </button>

        <button
          type="button"
          onClick={() => void handleToggleComments()}
          className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 transition ${
            isCommentsOpen
              ? 'bg-blue-50 text-blue-600'
              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
          }`}
        >
          <MessageCircle className="size-4" />
          Comment
        </button>

        <button
          type="button"
          onClick={() => void handleShare()}
          disabled={isSharing}
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-gray-500 transition hover:bg-gray-50 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSharing ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Repeat2 className="size-4" />
          )}
          Share
        </button>
      </div>

      {actionError ? (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {actionError}
        </div>
      ) : null}

      {isCommentsOpen ? (
        <div className="mt-4 space-y-4 rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex gap-3">
            <textarea
              value={commentDraft}
              onChange={(event) => setCommentDraft(event.target.value)}
              placeholder="Write a comment..."
              className="min-h-20 flex-1 resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm leading-6 text-gray-700 outline-none transition focus:border-blue-500"
            />
            <button
              type="button"
              onClick={() => void handleSubmitComment()}
              disabled={isSubmittingComment || !commentDraft.trim()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmittingComment ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <SendHorizonal className="size-4" />
              )}
            </button>
          </div>

          {commentError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {commentError}
            </div>
          ) : null}

          {isLoadingComments ? (
            <div className="flex justify-center py-4">
              <LoaderCircle className="size-5 animate-spin text-gray-400" />
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-3">
              {comments.map((comment) => (
                <CommentItem key={comment.id} comment={comment} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-500">
              No comments yet.
            </div>
          )}
        </div>
      ) : null}
    </article>
  )
}
