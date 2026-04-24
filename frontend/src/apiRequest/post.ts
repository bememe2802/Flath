import http from '@/src/lib/http'
import type {
  ApiEnvelope,
  PageResponse,
  Post,
  PostComment,
  PostReaction
} from '@/src/types/domain'

const postApiRequest = {
  create: (body: { content: string }) =>
    http.post<ApiEnvelope<Post>>('/post/create', body),
  myPosts: (page = 1, size = 20) =>
    http.get<ApiEnvelope<PageResponse<Post>>>(
      `/post/my-posts?page=${page}&size=${size}`
    ),
  toggleLike: (postId: string) =>
    http.post<ApiEnvelope<PostReaction>>(`/post/${postId}/likes/toggle`, {}),
  comments: (postId: string) =>
    http.get<ApiEnvelope<PostComment[]>>(`/post/${postId}/comments`),
  comment: (postId: string, body: { content: string }) =>
    http.post<ApiEnvelope<PostComment>>(`/post/${postId}/comments`, body),
  share: (postId: string, body?: { content?: string }) =>
    http.post<ApiEnvelope<Post>>(`/post/${postId}/share`, body ?? {})
}

export default postApiRequest
