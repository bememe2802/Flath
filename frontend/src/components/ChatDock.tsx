'use client'

import Link from 'next/link'
import {
  ExternalLink,
  LoaderCircle,
  MessageCircleMore,
  Minus,
  SendHorizonal,
  X
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import chatApiRequest from '@/src/apiRequest/chat'
import { useAppContext } from '@/src/app/app-provider'
import UserAvatar from '@/src/components/UserAvatar'
import {
  connectChatSocket,
  getConversationAvatar,
  getConversationTitle,
  mergeChatMessage,
  sortMessagesChronologically
} from '@/src/lib/chat'
import { formatRelativeTime } from '@/src/lib/presentation'
import type { ChatMessage, Conversation } from '@/src/types/domain'

export default function ChatDock() {
  const { profile, isReady } = useAppContext()
  const [isListOpen, setIsListOpen] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draftMessage, setDraftMessage] = useState('')
  const [isLoadingConversations, setIsLoadingConversations] = useState(false)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isWindowMinimized, setIsWindowMinimized] = useState(false)
  const [panelError, setPanelError] = useState('')
  const [socketError, setSocketError] = useState('')
  const socketRef = useRef<WebSocket | null>(null)
  const messagesViewportRef = useRef<HTMLDivElement | null>(null)

  const activeConversation = conversations.find(
    (conversation) => conversation.id === activeConversationId
  )

  const activeConversationTitle = activeConversation
    ? getConversationTitle(activeConversation, profile?.userId)
    : ''

  const activeConversationAvatar = activeConversation
    ? getConversationAvatar(activeConversation, profile?.userId)
    : null

  const loadConversations = async () => {
    if (!isReady) return

    setIsLoadingConversations(true)
    setPanelError('')

    try {
      const response = await chatApiRequest.myConversations()
      setConversations(response.payload.result)
    } catch {
      setPanelError('Unable to load your conversations right now.')
    } finally {
      setIsLoadingConversations(false)
    }
  }

  useEffect(() => {
    if (!isReady || (!isListOpen && !activeConversationId)) {
      return
    }

    loadConversations()
  }, [isReady, isListOpen, activeConversationId])

  useEffect(() => {
    let isDisposed = false

    async function loadMessages() {
      if (!activeConversationId) {
        setMessages([])
        return
      }

      setIsLoadingMessages(true)
      setSocketError('')

      try {
        const response = await chatApiRequest.messages(activeConversationId)
        if (isDisposed) return

        setMessages(sortMessagesChronologically(response.payload.result))
      } catch {
        if (!isDisposed) {
          setSocketError('Unable to load this conversation right now.')
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
      setSocketError('')
      return
    }

    const socket = connectChatSocket(activeConversationId, {
      onOpen: () => setSocketError(''),
      onMessage: (message) =>
        setMessages((current) => mergeChatMessage(current, message)),
      onError: (error) => setSocketError(error),
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
    if (isWindowMinimized) return

    const viewport = messagesViewportRef.current
    if (!viewport) return

    const animationFrame = window.requestAnimationFrame(() => {
      viewport.scrollTo({
        top: viewport.scrollHeight,
        behavior: 'auto'
      })
    })

    return () => window.cancelAnimationFrame(animationFrame)
  }, [activeConversationId, isWindowMinimized, messages.at(-1)?.id])

  const openConversation = (conversation: Conversation) => {
    setActiveConversationId(conversation.id)
    setIsWindowMinimized(false)
    setSocketError('')
    setDraftMessage('')
  }

  const closeConversation = () => {
    setActiveConversationId('')
    setMessages([])
    setDraftMessage('')
    setSocketError('')
    setIsWindowMinimized(false)
  }

  const sendMessage = async () => {
    const normalizedDraft = draftMessage.trim()
    if (!activeConversationId || !normalizedDraft) return

    setDraftMessage('')
    setSocketError('')

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
      setSocketError('Unable to send this message right now.')
      setDraftMessage(normalizedDraft)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsListOpen((current) => !current)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-700 transition hover:border-blue-200 hover:text-blue-600"
        aria-label="Toggle chat dock"
      >
        <MessageCircleMore className="size-4" />
      </button>

      {isListOpen ? (
        <section className="fixed bottom-4 right-4 z-[70] flex h-[32rem] w-[22rem] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                Chat
              </p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900">
                Conversations
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsListOpen(false)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label="Close conversation list"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoadingConversations ? (
              <div className="flex h-full items-center justify-center">
                <LoaderCircle className="size-5 animate-spin text-slate-400" />
              </div>
            ) : panelError ? (
              <div className="p-4 text-sm text-red-500">{panelError}</div>
            ) : conversations.length > 0 ? (
              conversations.map((conversation) => {
                const title = getConversationTitle(conversation, profile?.userId)
                const avatar = getConversationAvatar(conversation, profile?.userId)
                const isActive = conversation.id === activeConversationId

                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => openConversation(conversation)}
                    className={[
                      'flex w-full items-center gap-3 border-b border-slate-100 px-4 py-4 text-left transition',
                      isActive ? 'bg-amber-50/70' : 'hover:bg-slate-50'
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
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {formatRelativeTime(
                          conversation.modifiedDate || conversation.createdDate
                        )}
                      </p>
                    </div>
                  </button>
                )
              })
            ) : (
              <div className="p-4 text-sm text-slate-500">
                No conversation yet. Open the full chat page to start one.
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 px-4 py-3">
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-600"
            >
              Open full chat
              <ExternalLink className="size-4" />
            </Link>
          </div>
        </section>
      ) : null}

      {activeConversation && isWindowMinimized ? (
        <button
          type="button"
          onClick={() => setIsWindowMinimized(false)}
          className={[
            'fixed bottom-4 z-[71] flex max-w-[18rem] items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-3 shadow-xl transition hover:border-blue-200',
            isListOpen ? 'right-[24rem]' : 'right-4'
          ].join(' ')}
        >
          <UserAvatar
            src={activeConversationAvatar}
            name={activeConversationTitle}
            className="size-8"
            fallbackClassName="bg-slate-900 text-xs text-white"
          />
          <span className="truncate text-sm font-medium text-slate-900">
            {activeConversationTitle}
          </span>
        </button>
      ) : null}

      {activeConversation && !isWindowMinimized ? (
        <section
          className={[
            'fixed bottom-4 z-[71] flex h-[30rem] w-[22rem] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl',
            isListOpen ? 'right-[24rem]' : 'right-4'
          ].join(' ')}
        >
          <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
            <UserAvatar
              src={activeConversationAvatar}
              name={activeConversationTitle}
              className="size-10"
              fallbackClassName="bg-slate-900 text-white"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">
                {activeConversationTitle}
              </p>
              <p className="text-xs text-slate-500">Live conversation</p>
            </div>
            <button
              type="button"
              onClick={() => setIsWindowMinimized(true)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label="Minimize conversation"
            >
              <Minus className="size-4" />
            </button>
            <button
              type="button"
              onClick={closeConversation}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label="Close conversation"
            >
              <X className="size-4" />
            </button>
          </div>

          <div ref={messagesViewportRef} className="flex-1 overflow-y-auto px-4 py-4">
            {isLoadingMessages && messages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <LoaderCircle className="size-5 animate-spin text-slate-400" />
              </div>
            ) : messages.length > 0 ? (
              <div className="space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.me ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={[
                        'max-w-[78%] rounded-3xl px-4 py-3',
                        message.me
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-700'
                      ].join(' ')}
                    >
                      <p className="whitespace-pre-wrap text-sm leading-6">
                        {message.message}
                      </p>
                      <p className="mt-2 text-[11px] opacity-70">
                        {formatRelativeTime(message.createdDate)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-center text-sm text-slate-500">
                Send the first message to start this conversation.
              </div>
            )}
          </div>

          {socketError ? (
            <div className="border-t border-red-100 bg-red-50 px-4 py-2 text-xs text-red-500">
              {socketError}
            </div>
          ) : null}

          <div className="border-t border-slate-100 px-4 py-3">
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
                placeholder="Message..."
                className="min-h-20 flex-1 resize-none rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
              />
              <button
                type="button"
                onClick={() => void sendMessage()}
                disabled={!draftMessage.trim()}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-white disabled:opacity-50"
                aria-label="Send message"
              >
                <SendHorizonal className="size-4" />
              </button>
            </div>
          </div>
        </section>
      ) : null}
    </>
  )
}
