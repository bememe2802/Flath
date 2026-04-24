'use client'

import { LoaderCircle, Search, SendHorizonal } from 'lucide-react'
import { useDeferredValue, useEffect, useRef, useState } from 'react'

import chatApiRequest from '@/src/apiRequest/chat'
import profileApiRequest from '@/src/apiRequest/profile'
import { useAppContext } from '@/src/app/app-provider'
import UserAvatar from '@/src/components/UserAvatar'
import {
  connectChatSocket,
  getConversationAvatar,
  getConversationTitle,
  mergeChatMessage,
  sortMessagesChronologically
} from '@/src/lib/chat'
import { formatRelativeTime, getProfileName } from '@/src/lib/presentation'
import type { ChatMessage, Conversation, UserProfile } from '@/src/types/domain'

export default function ChatPage() {
  const { profile, isReady } = useAppContext()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draftMessage, setDraftMessage] = useState('')
  const [peopleQuery, setPeopleQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UserProfile[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isBooting, setIsBooting] = useState(true)
  const [chatError, setChatError] = useState('')
  const deferredQuery = useDeferredValue(peopleQuery)
  const messagesViewportRef = useRef<HTMLDivElement | null>(null)
  const socketRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    async function loadConversations() {
      setIsBooting(true)
      try {
        const response = await chatApiRequest.myConversations()
        setConversations(response.payload.result)
        setActiveConversationId((current) => current || response.payload.result[0]?.id || '')
      } finally {
        setIsBooting(false)
      }
    }

    if (isReady) {
      loadConversations()
    }
  }, [isReady])

  useEffect(() => {
    let isDisposed = false

    async function loadMessages() {
      if (!activeConversationId) {
        setMessages([])
        return
      }

      setMessages([])
      setIsLoadingMessages(true)
      setChatError('')
      setDraftMessage('')

      try {
        const response = await chatApiRequest.messages(activeConversationId)
        if (isDisposed) return

        setMessages(sortMessagesChronologically(response.payload.result))
      } catch {
        if (!isDisposed) {
          setChatError('Unable to load this conversation right now.')
          setMessages([])
        }
      } finally {
        if (!isDisposed) {
          setIsLoadingMessages(false)
        }
      }
    }

    loadMessages()

    return () => {
      isDisposed = true
    }
  }, [activeConversationId])

  useEffect(() => {
    if (!activeConversationId || !profile?.userId) {
      setChatError('')
      return
    }

    const socket = connectChatSocket(activeConversationId, {
      onOpen: () => setChatError(''),
      onMessage: (message) =>
        setMessages((current) => mergeChatMessage(current, message)),
      onError: (error) => setChatError(error),
      onClose: () => {
        if (socketRef.current === socket) {
          socketRef.current = null
        }
      }
    })

    socketRef.current = socket

    return () => {
      if (
        socket &&
        (socket.readyState === WebSocket.CONNECTING ||
          socket.readyState === WebSocket.OPEN)
      ) {
        socket.close()
      }

      if (socketRef.current === socket) {
        socketRef.current = null
      }
    }
  }, [activeConversationId, profile?.userId])

  useEffect(() => {
    const viewport = messagesViewportRef.current
    if (!viewport) return

    const animationFrame = window.requestAnimationFrame(() => {
      viewport.scrollTo({
        top: viewport.scrollHeight,
        behavior: 'auto'
      })
    })

    return () => window.cancelAnimationFrame(animationFrame)
  }, [activeConversationId, messages.at(-1)?.id])

  useEffect(() => {
    async function searchPeople() {
      const keyword = deferredQuery.trim()
      if (!keyword) {
        setSearchResults([])
        return
      }

      setIsSearching(true)
      try {
        const response = await profileApiRequest.searchProfiles(keyword)
        setSearchResults(response.payload.result)
      } finally {
        setIsSearching(false)
      }
    }

    searchPeople()
  }, [deferredQuery])

  const activeConversation = conversations.find(
    (conversation) => conversation.id === activeConversationId
  )

  const openDirectConversation = async (person: UserProfile) => {
    const response = await chatApiRequest.createConversation({
      type: 'DIRECT',
      participantIds: [person.userId]
    })

    const nextConversation = response.payload.result
    setConversations((current) => {
      const exists = current.some((conversation) => conversation.id === nextConversation.id)
      return exists ? current : [nextConversation, ...current]
    })
    setActiveConversationId(nextConversation.id)
    setPeopleQuery('')
    setSearchResults([])
  }

  const sendMessage = async () => {
    const normalizedDraft = draftMessage.trim()
    if (!activeConversationId || !normalizedDraft) return

    setDraftMessage('')
    setChatError('')

    const socket = socketRef.current
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ message: normalizedDraft }))
      return
    }

    try {
      const response = await chatApiRequest.sendMessage({
        conversationId: activeConversationId,
        message: normalizedDraft
      })

      setMessages((current) => mergeChatMessage(current, response.payload.result))
    } catch {
      setChatError('Unable to send this message right now.')
      setDraftMessage(normalizedDraft)
    }
  }

  return (
    <main className="page-shell">
      <div className="content-width grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
        <section className="panel-card overflow-hidden">
          <div className="border-b border-slate-100 p-5">
            <p className="section-kicker">Inbox</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
              Study conversations
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Live over WebSocket, with the full page kept intact.
            </p>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <Search className="size-4 text-slate-400" />
                <input
                  value={peopleQuery}
                  onChange={(event) => setPeopleQuery(event.target.value)}
                  placeholder="Search learners by username"
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>
            </div>

            {peopleQuery.trim() ? (
              <div className="mt-3 space-y-2">
                {isSearching ? (
                  <div className="panel-muted flex items-center gap-2 p-3 text-sm text-slate-500">
                    <LoaderCircle className="size-4 animate-spin" />
                    Searching learners...
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.slice(0, 4).map((person) => (
                    <button
                      key={person.userId}
                      type="button"
                      onClick={() => openDirectConversation(person)}
                      className="panel-muted flex w-full items-center gap-3 p-3 text-left transition hover:bg-white"
                    >
                      <UserAvatar
                        src={person.avatar}
                        name={getProfileName(person)}
                        className="size-10"
                        fallbackClassName="bg-slate-900 text-white"
                      />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {getProfileName(person)}
                        </p>
                        <p className="text-xs text-slate-500">@{person.username}</p>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="panel-muted p-3 text-sm text-slate-500">
                    No learners matched that search.
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <div className="max-h-[calc(100vh-240px)] overflow-y-auto">
            {isBooting ? (
              <div className="flex min-h-72 items-center justify-center">
                <LoaderCircle className="size-6 animate-spin text-slate-400" />
              </div>
            ) : conversations.length > 0 ? (
              conversations.map((conversation) => {
                const isActive = conversation.id === activeConversationId
                const title = getConversationTitle(conversation, profile?.userId)
                const avatar = getConversationAvatar(conversation, profile?.userId)

                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => setActiveConversationId(conversation.id)}
                    className={[
                      'flex w-full items-center gap-3 border-b border-slate-100 px-5 py-4 text-left transition',
                      isActive ? 'bg-amber-50/60' : 'hover:bg-slate-50'
                    ].join(' ')}
                  >
                    <UserAvatar
                      src={avatar}
                      name={title}
                      className="size-11"
                      fallbackClassName="bg-slate-900 text-white"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {title}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {conversation.type}
                      </p>
                    </div>
                  </button>
                )
              })
            ) : (
              <div className="p-5 text-sm text-slate-500">
                Search for a learner to create your first conversation.
              </div>
            )}
          </div>
        </section>

        <section className="panel-card flex min-h-[70vh] flex-col overflow-hidden">
          {activeConversation ? (
            <>
              <div className="border-b border-slate-100 p-5">
                <p className="section-kicker">Conversation</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                  {getConversationTitle(activeConversation, profile?.userId)}
                </h2>
              </div>

              <div ref={messagesViewportRef} className="flex-1 overflow-y-auto p-5">
                {isLoadingMessages && messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center">
                    <LoaderCircle className="size-6 animate-spin text-slate-400" />
                  </div>
                ) : messages.length > 0 ? (
                  <div className="space-y-4">
                    {messages.map((message) => {
                      const senderName = getProfileName(message.sender)

                      return (
                        <div
                          key={message.id}
                          className={`flex ${message.me ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={[
                              'max-w-[75%] rounded-3xl px-4 py-3',
                              message.me
                                ? 'bg-slate-900 text-white'
                                : 'bg-slate-100 text-slate-700'
                            ].join(' ')}
                          >
                            <p className="text-xs font-semibold opacity-75">
                              {message.me ? 'You' : senderName}
                            </p>
                            <p className="mt-1 whitespace-pre-wrap text-sm leading-6">
                              {message.message}
                            </p>
                            <p className="mt-2 text-[11px] opacity-70">
                              {formatRelativeTime(message.createdDate)}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-slate-500">
                    Say hello and start the study conversation.
                  </div>
                )}
              </div>

              {chatError ? (
                <div className="border-t border-red-100 bg-red-50 px-5 py-3 text-sm text-red-500">
                  {chatError}
                </div>
              ) : null}

              <div className="border-t border-slate-100 p-5">
                <div className="flex items-end gap-3">
                  <textarea
                    value={draftMessage}
                    onChange={(event) => setDraftMessage(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault()
                        void sendMessage()
                      }
                    }}
                    placeholder="Share a question, plan, or study check-in"
                    className="min-h-24 flex-1 resize-none rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => void sendMessage()}
                    disabled={!draftMessage.trim()}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    <SendHorizonal className="size-4" />
                    Send
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center p-10 text-center text-sm text-slate-500">
              Pick a conversation or search for a learner on the left to begin.
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
