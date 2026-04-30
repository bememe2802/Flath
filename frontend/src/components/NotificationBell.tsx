'use client'

import Link from 'next/link'
import { Bell, LoaderCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import notificationApiRequest from '@/src/apiRequest/notification'
import UserAvatar from '@/src/components/UserAvatar'
import { formatRelativeTime, getProfileName } from '@/src/lib/presentation'
import type { InAppNotification } from '@/src/types/domain'

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [items, setItems] = useState<InAppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')

  const hasUnread = unreadCount > 0

  const loadNotifications = async (showLoading: boolean) => {
    if (showLoading) {
      setIsLoading(true)
    }

    setErrorMessage('')

    try {
      const response = await notificationApiRequest.myNotifications()
      setItems(response.payload.result.data)
      setUnreadCount(response.payload.result.unreadCount)
    } catch {
      setErrorMessage('Unable to load notifications right now.')
    } finally {
      if (showLoading) {
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
    void loadNotifications(true)

    const timer = window.setInterval(() => {
      void loadNotifications(false)
    }, 15000)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    void loadNotifications(false)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || unreadCount === 0) {
      return
    }

    setItems((current) => current.map((item) => ({ ...item, read: true })))
    setUnreadCount(0)
    void notificationApiRequest.markAllAsRead()
  }, [isOpen, unreadCount])

  const content = useMemo(() => {
    if (isLoading) {
      return (
        <div className="flex h-36 items-center justify-center">
          <LoaderCircle className="size-5 animate-spin text-slate-400" />
        </div>
      )
    }

    if (errorMessage) {
      return <div className="p-4 text-sm text-red-500">{errorMessage}</div>
    }

    if (items.length === 0) {
      return (
        <div className="p-4 text-sm text-slate-500">
          No notifications yet. New posts will show up here.
        </div>
      )
    }

    return (
      <div className="max-h-[26rem] overflow-y-auto">
        {items.map((item) => {
          const actorName =
            getProfileName({
              userId: item.actorUserId,
              username: item.actorUsername ?? '',
              firstName: item.actorFirstName,
              lastName: item.actorLastName,
              avatar: item.actorAvatar
            }) || item.actorUsername || 'A learner'

          const body = (
            <div
              className={[
                'flex items-start gap-3 border-b border-slate-100 px-4 py-4 text-left transition',
                item.read ? 'bg-white' : 'bg-amber-50/40'
              ].join(' ')}
            >
              <UserAvatar
                src={item.actorAvatar}
                name={actorName}
                className="size-10"
                fallbackClassName="bg-slate-900 text-white"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-slate-600">{item.message}</p>
                <p className="mt-2 text-xs text-slate-400">
                  {formatRelativeTime(item.createdDate)}
                </p>
              </div>
            </div>
          )

          if (item.postId) {
            return (
              <Link key={item.id} href="/" onClick={() => setIsOpen(false)}>
                {body}
              </Link>
            )
          }

          return <div key={item.id}>{body}</div>
        })}
      </div>
    )
  }, [errorMessage, isLoading, items])

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-700 transition hover:border-blue-200 hover:text-blue-600"
        aria-label="Toggle notifications"
      >
        <Bell className="size-4" />
        {hasUnread ? (
          <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <section className="absolute right-0 top-12 z-[72] w-[23rem] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                Notifications
              </p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900">
                Recent updates
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </span>
          </div>
          {content}
        </section>
      ) : null}
    </div>
  )
}
