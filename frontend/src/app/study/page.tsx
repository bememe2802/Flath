'use client'

import { useEffect, useRef, useState } from 'react'
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
  const sessionStartedAt = useRef<Date | null>(null)

  const loadStudyData = async (showLoading: boolean) => {
    if (!isReady) return

    if (showLoading) {
      setIsLoadingStudy(true)
    }

    try {
      const [statsResponse, sessionsResponse] = await Promise.all([
        studyApiRequest.myStats(),
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
  }

  useEffect(() => {
    if (isReady) {
      void loadStudyData(true)
    }
  }, [isReady])

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

  const minutes = Math.floor(remainingSeconds / 60)
  const seconds = remainingSeconds % 60
  const chartData = buildStudyChartHours(insights.chart)

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="flex">
        <aside className="hidden w-60 border-r bg-white lg:flex lg:flex-col">
          <div className="border-b p-4 text-lg font-bold text-blue-600">Study</div>
          <div className="space-y-2 p-4 text-sm text-gray-700">
            <div className="rounded-lg bg-blue-50 px-4 py-2 font-medium text-blue-700">
              Focus room
            </div>
            <div className="rounded-lg px-4 py-2">Hours today: {formatDuration(insights.todaySeconds)}</div>
            <div className="rounded-lg px-4 py-2">This week: {formatDuration(insights.weekSeconds)}</div>
            <div className="rounded-lg px-4 py-2">Streak: {insights.streakDays} days</div>
          </div>
        </aside>

        <section className="flex-1 p-6">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-gray-800">Pomodoro Timer</h2>
              <div className="mb-6 text-6xl font-bold text-gray-700">
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
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {isRunning ? <Pause className="size-4" /> : <Play className="size-4" />}
                  {isRunning ? 'Pause' : 'Start'}
                </button>
                <button
                  type="button"
                  onClick={() => void saveCurrentProgress()}
                  disabled={isSavingSession}
                  className="flex items-center gap-2 rounded-lg bg-gray-100 px-5 py-2 text-gray-700 hover:bg-gray-200 disabled:opacity-60"
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
                  className="flex items-center gap-2 rounded-lg bg-gray-100 px-5 py-2 text-gray-700 hover:bg-gray-200"
                >
                  <RotateCcw className="size-4" />
                  Reset
                </button>
              </div>

              {statusMessage ? (
                <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                  {statusMessage}
                </div>
              ) : null}
            </div>

            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-800">Giờ học trong 7 ngày</h2>
              <div className="h-72">
                {isLoadingStudy ? (
                  <div className="flex h-full items-center justify-center">
                    <LoaderCircle className="size-6 animate-spin text-gray-400" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <XAxis dataKey="label" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="hours" fill="#2563eb" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="rounded-xl border bg-white p-6 shadow-sm xl:col-span-2">
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <p className="text-sm text-gray-500">Today</p>
                  <p className="mt-2 text-2xl font-semibold text-gray-900">
                    {formatDuration(insights.todaySeconds)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Week</p>
                  <p className="mt-2 text-2xl font-semibold text-gray-900">
                    {formatDuration(insights.weekSeconds)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Month</p>
                  <p className="mt-2 text-2xl font-semibold text-gray-900">
                    {formatDuration(insights.monthSeconds)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Year</p>
                  <p className="mt-2 text-2xl font-semibold text-gray-900">
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
