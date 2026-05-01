import http from '@/src/lib/http'
import type {
  ApiEnvelope,
  StudyLeaderboardEntry,
  StudySession,
  StudyStats
} from '@/src/types/domain'

const studyApiRequest = {
  createSession: (body: {
    startedAt: string
    endedAt: string
    focusLabel?: string
  }) => http.post<ApiEnvelope<StudySession>>('/study/sessions', body),
  mySessions: (limit = 30) =>
    http.get<ApiEnvelope<StudySession[]>>(`/study/sessions/my-sessions?limit=${limit}`),
  myStats: (chartType = 'week') =>
    http.get<ApiEnvelope<StudyStats>>(`/study/stats/my-stats?chartType=${chartType}`),
  globalLeaderboard: (limit = 20) =>
    http.get<ApiEnvelope<StudyLeaderboardEntry[]>>(
      `/study/leaderboard/global?limit=${limit}`
    ),
  weeklyLeaderboard: (limit = 20) =>
    http.get<ApiEnvelope<StudyLeaderboardEntry[]>>(
      `/study/leaderboard/weekly?limit=${limit}`
    )
}

export default studyApiRequest
