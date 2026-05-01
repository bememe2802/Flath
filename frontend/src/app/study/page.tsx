'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import {
  LoaderCircle,
  Mail,
  Pause,
  Play,
  RotateCcw,
  Save
} from 'lucide-react'

import notificationApiRequest from '@/src/apiRequest/notification'
import studyApiRequest from '@/src/apiRequest/study'
import { useAppContext } from '@/src/app/app-provider'
import { getProfileName } from '@/src/lib/presentation'
import {
  buildEmptyStudyStats,
  buildStudyChartHours,
  formatDuration
} from '@/src/lib/study'
import type { StudySession, StudyStats } from '@/src/types/domain'

const focusModes = [
  { label: '25 min', minutes: 25 },
  { label: '50 min', minutes: 50 },
  { label: '90 min', minutes: 90 }
]

const chartTabs = [
  { key: 'week', label: 'Tuần' },
  { key: 'month', label: 'Tháng' },
  { key: 'year', label: 'Năm' }
]

export default function StudyPage() {
  const { profile, isReady } = useAppContext()
  const [selectedMinutes, setSelectedMinutes] = useState(25)
  const [remainingSeconds, setRemainingSeconds] = useState(25 * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [records, setRecords] = useState<StudySession[]>([])
  const [insights, setInsights] = useState<StudyStats>(buildEmptyStudyStats())
  const [statusMessage, setStatusMessage] = useState('')
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [isLoadingStudy, setIsLoadingStudy] = useState(true)
  const [isSavingSession, setIsSavingSession] = useState(false)
  const [chartType, setChartType] = useState('week')
  const sessionStartedAt = useRef<Date | null>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadStudyData = useCallback(async (showLoading: boolean, ct?: string) => {
    if (!isReady) return

    if (showLoading) {
      setIsLoadingStudy(true)
    }

    try {
      const type = ct ?? chartType
      const [statsResponse, sessionsResponse] = await Promise.all([
        studyApiRequest.myStats(type),
        studyApiRequest.mySessions(30)
      ])

      setInsights(statsResponse.payload.result)
      setRecords(sessionsResponse.payload.result)
    } catch {
      if (showLoading) {
        setStatusMessage('Unable to load study data right now.')
      }
    } finally {
      if (showLoading) {
        setIsLoadingStudy(false)
      }
    }
  }, [isReady, chartType])

  // Initial load
  useEffect(() => {
    if (isReady) {
      void loadStudyData(true)
    }
  }, [isReady, loadStudyData])

  // Polling every 30s for real-time updates
  useEffect(() => {
    if (!isReady) return

    pollingRef.current = setInterval(() => {
      void loadStudyData(false)
    }, 30000)

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [isReady, loadStudyData])

  // Timer logic
  useEffect(() => {
    if (!isRunning) return

    const timer = window.setInterval(() => {
      setRemainingSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(timer)
          setIsRunning(false)

          const now = new Date()
          const startedAt =
            sessionStartedAt.current ??
            new Date(now.getTime() - selectedMinutes * 60 * 1000)

          sessionStartedAt.current = null

          void persistSession({
            startedAt,
            endedAt: now,
            focusLabel: `${selectedMinutes} minute session`,
            successMessage: 'Session completed and added to your study log.',
            remainingAfterSave: 0
          })

          return 0
        }

        return current - 1
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [isRunning, selectedMinutes])

  const persistSession = async (params: {
    startedAt: Date
    endedAt: Date
    focusLabel: string
    successMessage: string
    remainingAfterSave: number
  }) => {
    setIsSavingSession(true)
    setStatusMessage('')

    try {
      await studyApiRequest.createSession({
        startedAt: params.startedAt.toISOString(),
        endedAt: params.endedAt.toISOString(),
        focusLabel: params.focusLabel
      })

      await loadStudyData(false)
      setRemainingSeconds(params.remainingAfterSave)
      setStatusMessage(params.successMessage)
    } catch {
      setStatusMessage('Unable to save this study session right now.')
    } finally {
      setIsSavingSession(false)
    }
  }

  const startTimer = () => {
    if (!sessionStartedAt.current) {
      sessionStartedAt.current = new Date()
    }
    setStatusMessage('')
    setIsRunning(true)
  }

  const pauseTimer = () => {
    setIsRunning(false)
  }

  const resetTimer = () => {
    setIsRunning(false)
    sessionStartedAt.current = null
    setRemainingSeconds(selectedMinutes * 60)
    setStatusMessage('Timer reset.')
  }

  const saveCurrentProgress = async () => {
    const elapsedSeconds = selectedMinutes * 60 - remainingSeconds
    if (elapsedSeconds < 60) {
      setStatusMessage('Log at least one minute before saving a session.')
      return
    }

    const now = new Date()
    const startedAt =
      sessionStartedAt.current ?? new Date(now.getTime() - elapsedSeconds * 1000)

    setIsRunning(false)
    sessionStartedAt.current = null

    await persistSession({
      startedAt,
      endedAt: now,
      focusLabel: `${selectedMinutes} minute session`,
      successMessage: 'Your current focus block has been saved.',
      remainingAfterSave: selectedMinutes * 60
    })
  }

  const sendStudyRecap = async () => {
    if (!profile?.email) {
      setStatusMessage('Add an email on your profile before sending a recap.')
      return
    }

    setIsSendingEmail(true)
    setStatusMessage('')

    try {
      await notificationApiRequest.sendStudyRecap({
        to: {
          name: getProfileName(profile),
          email: profile.email
        },
        subject: 'Your Flath study recap',
        htmlContent: `
          <h2>Flath Study Recap</h2>
          <p>Total logged: <strong>${formatDuration(insights.totalSeconds)}</strong></p>
          <p>Today: <strong>${formatDuration(insights.todaySeconds)}</strong></p>
          <p>This week: <strong>${formatDuration(insights.weekSeconds)}</strong></p>
          <p>Current streak: <strong>${insights.streakDays} day(s)</strong></p>
        `
      })
      setStatusMessage('Study recap sent to your email.')
    } catch {
      setStatusMessage('Unable to send a recap email right now.')
    } finally {
      setIsSendingEmail(false)
    }
  }

  const handleChartTypeChange = (type: string) => {
    setChartType(type)
    void loadStudyData(true, type)
  }

  const minutes = Math.floor(remainingSeconds / 60)
  const seconds = remainingSeconds % 60
  const chartData = buildStudyChartHours(insights.chart)

  return (
    <main className="min-h-screen bg-muted/50">
      <div className="flex">
        <aside className="hidden w-60 border-r bg-card lg:flex lg:flex-col">
          <div className="border-b p-4 text-lg font-bold text-primary">Study</div>
          <div className="space-y-2 p-4 text-sm text-foreground/70">
            <div className="rounded-lg bg-primary/10 px-4 py-2 font-medium text-primary">
              Focus room
            </div>
            <div className="rounded-lg px-4 py-2">Hours today: {formatDuration(insights.todaySeconds)}</div>
            <div className="rounded-lg px-4 py-2">This week: {formatDuration(insights.weekSeconds)}</div>
            <div className="rounded-lg px-4 py-2">Streak: {insights.streakDays} days</div>
          </div>
        </aside>

        <section className="flex-1 p-6">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-foreground">Pomodoro Timer</h2>
              <div className="mb-6 text-6xl font-bold text-foreground/80">
                {minutes.toString().padStart(2, '0')}:
                {seconds.toString().padStart(2, '0')}
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                {focusModes.map((mode) => (
                  <button
                    key={mode.minutes}
                    type="button"
                    onClick={() => {
                      setSelectedMinutes(mode.minutes)
                      setRemainingSeconds(mode.minutes * 60)
                      setIsRunning(false)
                      sessionStartedAt.current = null
                    }}
                    className={`rounded-lg px-4 py-2 text-sm transition ${selectedMinutes === mode.minutes
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground/70 hover:bg-accent'
                      }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={isRunning ? pauseTimer : startTimer}
                  disabled={isSavingSession}
                  className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                >
                  {isRunning ? <Pause className="size-4" /> : <Play className="size-4" />}
                  {isRunning ? 'Pause' : 'Start'}
                </button>
                <button
                  type="button"
                  onClick={() => void saveCurrentProgress()}
                  disabled={isSavingSession}
                  className="flex items-center gap-2 rounded-lg bg-muted px-5 py-2 text-foreground/70 hover:bg-accent disabled:opacity-60"
                >
                  {isSavingSession ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  Save
                </button>
                <button
                  type="button"
                  onClick={resetTimer}
                  className="flex items-center gap-2 rounded-lg bg-muted px-5 py-2 text-foreground/70 hover:bg-accent"
                >
                  <RotateCcw className="size-4" />
                  Reset
                </button>
              </div>

              {statusMessage ? (
                <div className="mt-4 rounded-lg border bg-muted/50 px-4 py-3 text-sm text-foreground/70">
                  {statusMessage}
                </div>
              ) : null}
            </div>

            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Giờ học</h2>
                <div className="flex gap-1 rounded-lg bg-muted p-1">
                  {chartTabs.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => handleChartTypeChange(tab.key)}
                      className={`rounded-md px-3 py-1.5 text-sm transition ${chartType === tab.key
                        ? 'bg-card text-primary shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-72">
                {isLoadingStudy ? (
                  <div className="flex h-full items-center justify-center">
                    <LoaderCircle className="size-6 animate-spin text-muted-foreground/60" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11 }}
                        interval={chartType === 'month' ? Math.max(1, Math.floor(chartData.length / 15)) : 0}
                      />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="hours" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="rounded-xl border bg-card p-6 shadow-sm xl:col-span-2">
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <p className="text-sm text-muted-foreground">Today</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    {formatDuration(insights.todaySeconds)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Week</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    {formatDuration(insights.weekSeconds)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Month</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    {formatDuration(insights.monthSeconds)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Year</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    {formatDuration(insights.yearSeconds)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}