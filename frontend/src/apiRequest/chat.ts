import http from '@/src/lib/http'
import type {
  ApiEnvelope,
  ChatMessage,
  Conversation
} from '@/src/types/domain'

const chatApiRequest = {
  myConversations: () =>
    http.get<ApiEnvelope<Conversation[]>>('/chat/conversations/my-conversations'),
  createConversation: (body: { type: string; participantIds: string[] }) =>
    http.post<ApiEnvelope<Conversation>>('/chat/conversations/create', body),
  messages: (conversationId: string) =>
    http.get<ApiEnvelope<ChatMessage[]>>(
      `/chat/messages?conversationId=${conversationId}`
    ),
  sendMessage: (body: { conversationId: string; message: string }) =>
    http.post<ApiEnvelope<ChatMessage>>('/chat/messages/create', body)
}

export default chatApiRequest
