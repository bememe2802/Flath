import envConfig from '@/src/config'
import { SESSION_COOKIE_KEY, getCookie } from '@/src/lib/session'
import { getProfileName } from '@/src/lib/presentation'
import type {
  ChatMessage,
  ChatSocketEvent,
  Conversation
} from '@/src/types/domain'

type ChatSocketCallbacks = {
  onMessage?: (message: ChatMessage) => void
  onError?: (error: string) => void
  onOpen?: () => void
  onClose?: () => void
}

export function getConversationTitle(
  conversation: Conversation,
  currentUserId?: string | null
) {
  if (conversation.conversationName) return conversation.conversationName

  const others = conversation.participants.filter(
    (participant) => participant.userId !== currentUserId
  )

  if (others.length === 0) {
    return 'Solo space'
  }

  return others.map((participant) => getProfileName(participant)).join(', ')
}

export function getConversationAvatar(
  conversation: Conversation,
  currentUserId?: string | null
) {
  const firstOther = conversation.participants.find(
    (participant) => participant.userId !== currentUserId
  )

  return firstOther?.avatar ?? conversation.conversationAvatar ?? null
}

export function sortMessagesChronologically(items: ChatMessage[]) {
  return [...items].sort((left, right) => {
    const leftTime = left.createdDate ? new Date(left.createdDate).getTime() : 0
    const rightTime = right.createdDate ? new Date(right.createdDate).getTime() : 0

    if (leftTime !== rightTime) {
      return leftTime - rightTime
    }

    return left.id.localeCompare(right.id)
  })
}

export function mergeChatMessage(
  items: ChatMessage[],
  incoming: ChatMessage
): ChatMessage[] {
  const withoutDuplicate = items.filter((item) => item.id !== incoming.id)
  return sortMessagesChronologically([...withoutDuplicate, incoming])
}

export function buildChatSocketUrl(conversationId: string) {
  if (!conversationId) return null

  const token = getCookie(SESSION_COOKIE_KEY)
  if (!token) return null

  try {
    const url = new URL(envConfig.NEXT_PUBLIC_API_ENDPOINT)
    const normalizedPath =
      url.pathname === '/' ? '' : url.pathname.replace(/\/$/, '')

    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
    url.pathname = `${normalizedPath}/chat/ws`
    url.search = new URLSearchParams({
      conversationId,
      token
    }).toString()
    url.hash = ''

    return url.toString()
  } catch {
    return null
  }
}

export function connectChatSocket(
  conversationId: string,
  callbacks: ChatSocketCallbacks
) {
  if (typeof window === 'undefined' || typeof WebSocket === 'undefined') {
    return null
  }

  const socketUrl = buildChatSocketUrl(conversationId)
  if (!socketUrl) return null

  const socket = new WebSocket(socketUrl)

  socket.addEventListener('open', () => callbacks.onOpen?.())
  socket.addEventListener('close', () => callbacks.onClose?.())
  socket.addEventListener('error', () =>
    callbacks.onError?.('Live chat connection interrupted.')
  )
  socket.addEventListener('message', (event) => {
    try {
      const payload = JSON.parse(event.data) as ChatSocketEvent

      if (payload.type === 'MESSAGE' && payload.message) {
        callbacks.onMessage?.(payload.message)
        return
      }

      if (payload.type === 'ERROR') {
        callbacks.onError?.(payload.error || 'Unable to send this message.')
      }
    } catch {
      callbacks.onError?.('Unable to read the latest chat event.')
    }
  })

  return socket
}
