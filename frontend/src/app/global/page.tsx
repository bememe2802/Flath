import UserAvatar from '@/src/components/UserAvatar'
import { serverApiRequest } from '@/src/lib/server-api'
import { getProfileName } from '@/src/lib/presentation'
import { formatDuration } from '@/src/lib/study'

export default async function GlobalPage() {
  const [leaderboardRes, profileRes] = await Promise.all([
    serverApiRequest.globalLeaderboard(50).catch(() => null),
    serverApiRequest
      .myProfile({ requireAuth: false, redirectOnUnauthorized: false })
      .catch(() => null)
  ])

  const entries = leaderboardRes?.result ?? []
  const currentUserId = profileRes?.result.userId

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto w-full max-w-6xl rounded-xl border border-gray-200 bg-white shadow-md">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-800">Global Ranking</h1>
          <p className="text-sm text-gray-500">
            Total Participants: {entries.length.toLocaleString()}
          </p>
        </div>

        {entries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-100 text-xs font-semibold uppercase text-gray-700">
                <tr>
                  <th className="w-[10%] px-6 py-3">#</th>
                  <th className="w-[30%] px-6 py-3">Name</th>
                  <th className="w-[20%] px-6 py-3">City</th>
                  <th className="w-[15%] px-6 py-3">Weekly</th>
                  <th className="w-[10%] px-6 py-3">Streak</th>
                  <th className="w-[15%] px-6 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => {
                  const name = getProfileName(entry)
                  const isCurrentUser = entry.userId === currentUserId

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
