'use client'

import { LoaderCircle, Medal, Sparkles, Trophy } from 'lucide-react'
import { useEffect, useState } from 'react'

import studyApiRequest from '@/src/apiRequest/study'
import UserAvatar from '@/src/components/UserAvatar'
import { getProfileName } from '@/src/lib/presentation'
import { formatDuration } from '@/src/lib/study'
import type { StudyLeaderboardEntry } from '@/src/types/domain'

const tierLabels = [
  { name: 'Bronze', minHours: 0, tone: 'bg-orange-50 text-orange-700' },
  { name: 'Silver', minHours: 6, tone: 'bg-slate-100 text-slate-700' },
  { name: 'Gold', minHours: 12, tone: 'bg-amber-100 text-amber-800' },
  { name: 'Platinum', minHours: 20, tone: 'bg-sky-100 text-sky-800' }
]

function getTier(weekSeconds: number) {
  const weekHours = weekSeconds / 3600
  return [...tierLabels].reverse().find((tier) => weekHours >= tier.minHours) ?? tierLabels[0]
}

export default function LeaguePage() {
  const [entries, setEntries] = useState<StudyLeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function bootstrap() {
      setIsLoading(true)

      try {
        const response = await studyApiRequest.weeklyLeaderboard(12)
        setEntries(response.payload.result)
      } catch {
        setEntries([])
      } finally {
        setIsLoading(false)
      }
    }

    void bootstrap()
  }, [])

  const podium = entries.slice(0, 3)

  return (
    <main className="page-shell">
      <div className="content-width space-y-6">
        <section className="panel-card p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <p className="section-kicker">League board</p>
              <h1 className="section-title">
                See which learners are converting effort into visible weekly
                momentum.
              </h1>
              <p className="section-copy">
                League view now runs on the study-service weekly leaderboard, so
                tiers reflect real study time instead of placeholder scoring.
              </p>
            </div>
            <span className="stat-chip">
              <Sparkles className="size-3.5" />
              {entries.length} highlighted spots
            </span>
          </div>
        </section>

        {isLoading ? (
          <section className="panel-card flex min-h-80 items-center justify-center">
            <LoaderCircle className="size-6 animate-spin text-slate-400" />
          </section>
        ) : entries.length > 0 ? (
          <>
            <section className="grid gap-6 lg:grid-cols-3">
              {podium.map((entry, index) => {
                const name = getProfileName(entry)

                return (
                  <article
                    key={entry.userId}
                    className={[
                      'panel-card p-6',
                      index === 0 ? 'lg:-translate-y-3' : ''
                    ].join(' ')}
                  >
                    <div className="flex items-center justify-between">
                      <span className="stat-chip">
                        <Trophy className="size-3.5" />
                        #{index + 1}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getTier(
                          entry.weekSeconds
                        ).tone}`}
                      >
                        {getTier(entry.weekSeconds).name}
                      </span>
                    </div>

                    <div className="mt-6 flex items-center gap-4">
                      <UserAvatar
                        src={entry.avatar}
                        name={name}
                        className="size-14"
                        fallbackClassName="bg-slate-900 text-white"
                      />
                      <div>
                        <h2 className="text-xl font-semibold text-slate-900">{name}</h2>
                        <p className="text-sm text-slate-500">@{entry.username}</p>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-3">
                      <div className="panel-muted p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          This week
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-slate-900">
                          {formatDuration(entry.weekSeconds)}
                        </p>
                      </div>
                      <div className="panel-muted p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Streak
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-slate-900">
                          {entry.streakDays} days
                        </p>
                      </div>
                    </div>
                  </article>
                )
              })}
            </section>

            <section className="panel-card p-6 md:p-8">
              <div className="flex items-center gap-2">
                <Medal className="size-5 text-slate-400" />
                <h2 className="text-2xl font-semibold text-slate-900">Tier ladder</h2>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {tierLabels.map((tier) => (
                  <div key={tier.name} className="panel-muted p-5">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tier.tone}`}>
                      {tier.name}
                    </span>
                    <p className="mt-4 text-sm text-slate-600">
                      Unlock at {tier.minHours}h of weekly study volume on the
                      league board.
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : (
          <section className="panel-card p-6 text-sm text-slate-500">
            No weekly sessions have been recorded yet, so the league board is
            still empty.
          </section>
        )}
      </div>
    </main>
  )
}
