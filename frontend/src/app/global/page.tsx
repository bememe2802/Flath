'use client'

import { LoaderCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

import studyApiRequest from '@/src/apiRequest/study'
import { useAppContext } from '@/src/app/app-provider'
import UserAvatar from '@/src/components/UserAvatar'
import { getProfileName } from '@/src/lib/presentation'
import { formatDuration } from '@/src/lib/study'
import type { StudyLeaderboardEntry } from '@/src/types/domain'

export default function GlobalPage() {
  const { profile, isReady } = useAppContext()
  const [entries, setEntries] = useState<StudyLeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function bootstrap() {
      setIsLoading(true)

      try {
        const response = await studyApiRequest.globalLeaderboard(50)
        setEntries(response.payload.result)
      } catch {
        setEntries([])
      } finally {
        setIsLoading(false)
      }
    }

    if (isReady) {
      void bootstrap()
    }
  }, [isReady])

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto w-full max-w-6xl rounded-xl border border-gray-200 bg-white shadow-md">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-800">Global Ranking</h1>
          <p className="text-sm text-gray-500">
            Total Participants: {entries.length.toLocaleString()}
          </p>
        </div>

        {isLoading ? (
          <div className="flex min-h-80 items-center justify-center">
            <LoaderCircle className="size-6 animate-spin text-gray-400" />
          </div>
        ) : entries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-100 text-xs font-semibold uppercase text-gray-700">
                <tr>
                  <th className="px-6 py-3 w-[10%]">#</th>
                  <th className="px-6 py-3 w-[30%]">Name</th>
                  <th className="px-6 py-3 w-[20%]">City</th>
                  <th className="px-6 py-3 w-[15%]">Weekly</th>
                  <th className="px-6 py-3 w-[10%]">Streak</th>
                  <th className="px-6 py-3 w-[15%] text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => {
                  const name = getProfileName(entry)
                  const isCurrentUser = entry.userId === profile?.userId

                  return (
                    <tr
                      key={entry.userId}
                      className={`border-b hover:bg-gray-50 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      } ${isCurrentUser ? '!bg-blue-50' : ''}`}
                    >
                      <td className="px-6 py-3 font-semibold text-gray-700">
                        {index + 1}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            src={entry.avatar}
                            name={name}
                            className="size-8"
                            fallbackClassName="bg-gray-900 text-white"
                          />
                          <div>
                            <p className="font-medium text-gray-900">{name}</p>
                            <p className="text-xs text-gray-500">
                              @{entry.username}
                              {isCurrentUser ? ' · you' : ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-gray-700">
                        {entry.city || 'Unknown'}
                      </td>
                      <td className="px-6 py-3 text-gray-700">
                        {formatDuration(entry.weekSeconds)}
                      </td>
                      <td className="px-6 py-3 text-gray-700">
                        {entry.streakDays}d
                      </td>
                      <td className="px-6 py-3 text-right font-semibold text-gray-800">
                        {formatDuration(entry.totalSeconds)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-sm text-gray-500">
            No study sessions have been logged yet.
          </div>
        )}
      </div>
    </main>
  )
}
