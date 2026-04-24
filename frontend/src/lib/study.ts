import type { StudyChartPoint, StudyStats } from '@/src/types/domain'

export function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  if (hours === 0) return `${minutes}m`
  return `${hours}h ${minutes}m`
}

export function buildEmptyStudyStats(): StudyStats {
  return {
    totalSeconds: 0,
    todaySeconds: 0,
    weekSeconds: 0,
    monthSeconds: 0,
    yearSeconds: 0,
    streakDays: 0,
    chart: []
  }
}

export function buildStudyChartHours(chart: StudyChartPoint[]) {
  return chart.map((point) => ({
    ...point,
    hours: Number((point.totalSeconds / 3600).toFixed(1))
  }))
}
