import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import envConfig from '@/src/config'
import type { ApiEnvelope, ChatMessage, Conversation, PageResponse, Post, StudyLeaderboardEntry, StudySession, StudyStats, UserProfile } from '@/src/types/domain'

type ServerRequestOptions = Omit<RequestInit, 'body'> & {
  body?: FormData | Record<string, unknown> | string
  requireAuth?: boolean
  redirectOnUnauthorized?: boolean
}

function buildUrl(path: string) {
  return path.startsWith('/')
    ? `${envConfig.NEXT_PUBLIC_API_ENDPOINT}${path}`
    : `${envConfig.NEXT_PUBLIC_API_ENDPOINT}/${path}`
}

async function getServerSessionToken() {
  return (await cookies()).get('sessionToken')?.value ?? null
}

export async function serverRequest<Response>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  options?: ServerRequestOptions
) {
  const token = await getServerSessionToken()

  if (options?.requireAuth !== false && !token) {
    redirect('/login')
  }

  const headers = new Headers(options?.headers)
  let body: BodyInit | undefined

  if (options?.body instanceof FormData) {
    body = options.body
  } else if (typeof options?.body === 'string') {
    body = options.body
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }
  } else if (options?.body) {
    body = JSON.stringify(options.body)
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(buildUrl(path), {
    ...options,
    method,
    body,
    headers,
    cache: 'no-store'
  })

  if (response.status === 401 && options?.redirectOnUnauthorized !== false) {
    redirect('/login')
  }

  if (!response.ok) {
    throw new Error(`Server request failed: ${method} ${path}`)
  }

  return response.json() as Promise<Response>
}

export const serverApiRequest = {
  myProfile: (options?: { requireAuth?: boolean; redirectOnUnauthorized?: boolean }) =>
    serverRequest<ApiEnvelope<UserProfile>>('GET', '/profile/users/my-profile', options),
  newsfeed: (page = 1, size = 20) =>
    serverRequest<ApiEnvelope<PageResponse<Post>>>(
      'GET',
      `/newsfeed/feed?page=${page}&size=${size}`
    ),
  myStudyStats: () =>
    serverRequest<ApiEnvelope<StudyStats>>('GET', '/study/stats/my-stats'),
  myStudySessions: (limit = 30) =>
    serverRequest<ApiEnvelope<StudySession[]>>(
      'GET',
      `/study/sessions/my-sessions?limit=${limit}`
    ),
  globalLeaderboard: (limit = 20) =>
    serverRequest<ApiEnvelope<StudyLeaderboardEntry[]>>(
      'GET',
      `/study/leaderboard/global?limit=${limit}`
    ),
  weeklyLeaderboard: (limit = 20) =>
    serverRequest<ApiEnvelope<StudyLeaderboardEntry[]>>(
      'GET',
      `/study/leaderboard/weekly?limit=${limit}`
    ),
  myPosts: (page = 1, size = 20) =>
    serverRequest<ApiEnvelope<PageResponse<Post>>>(
      'GET',
      `/post/my-posts?page=${page}&size=${size}`
    ),
  myConversations: () =>
    serverRequest<ApiEnvelope<Conversation[]>>(
      'GET',
      '/chat/conversations/my-conversations'
    ),
  conversationMessages: (conversationId: string) =>
    serverRequest<ApiEnvelope<ChatMessage[]>>(
      'GET',
      `/chat/messages?conversationId=${conversationId}`
    )
}
