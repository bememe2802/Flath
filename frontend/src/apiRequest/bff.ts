import http from '@/src/lib/http'
import type {
  ApiEnvelope,
  HomeBffResponse,
  LeagueBffResponse,
  MeBffResponse
} from '@/src/types/domain'

const bffApiRequest = {
  home: () =>
    http.get<ApiEnvelope<HomeBffResponse>>('/api/bff/home', {
      baseUrl: ''
    }),
  me: () =>
    http.get<ApiEnvelope<MeBffResponse>>('/api/bff/me', {
      baseUrl: ''
    }),
  league: () =>
    http.get<ApiEnvelope<LeagueBffResponse>>('/api/bff/league', {
      baseUrl: ''
    })
}

export default bffApiRequest
