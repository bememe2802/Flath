import { buildEmptyStudyStats } from '@/src/lib/study'
import { serverApiRequest } from '@/src/lib/server-api'
import type {
  HomeBffResponse,
  LeagueBffResponse,
  MeBffResponse
} from '@/src/types/domain'

export async function getHomeBff(): Promise<HomeBffResponse> {
  const [profileRes, feedRes, statsRes] = await Promise.all([
    serverApiRequest
      .myProfile({ requireAuth: false, redirectOnUnauthorized: false })
      .catch(() => null),
    serverApiRequest.newsfeed(1, 30),
    serverApiRequest.myStudyStats().catch(() => null)
  ])

  return {
    profile: profileRes?.result ?? null,
    feed: feedRes.result,
    studyStats: statsRes?.result ?? buildEmptyStudyStats()
  }
}

export async function getMeBff(): Promise<MeBffResponse> {
  const [profileRes, postsRes, statsRes] = await Promise.all([
    serverApiRequest.myProfile(),
    serverApiRequest.myPosts(1, 50).catch(() => null),
    serverApiRequest.myStudyStats().catch(() => null)
  ])

  return {
    profile: profileRes.result,
    posts: postsRes?.result ?? {
      currentPage: 1,
      pageSize: 50,
      totalPages: 1,
      totalElements: 0,
      data: []
    },
    studyStats: statsRes?.result ?? buildEmptyStudyStats()
  }
}

export async function getLeagueBff(): Promise<LeagueBffResponse> {
  const [profileRes, leaderboardRes] = await Promise.all([
    serverApiRequest
      .myProfile({ requireAuth: false, redirectOnUnauthorized: false })
      .catch(() => null),
    serverApiRequest.weeklyLeaderboard(12).catch(() => null)
  ])

  return {
    profile: profileRes?.result ?? null,
    entries: leaderboardRes?.result ?? []
  }
}
