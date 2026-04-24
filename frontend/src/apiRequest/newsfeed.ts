import http from '@/src/lib/http'
import type { ApiEnvelope, PageResponse, Post } from '@/src/types/domain'

const newsfeedApiRequest = {
  feed: (page = 1, size = 20) =>
    http.get<ApiEnvelope<PageResponse<Post>>>(
      `/newsfeed/feed?page=${page}&size=${size}`
    )
}

export default newsfeedApiRequest
