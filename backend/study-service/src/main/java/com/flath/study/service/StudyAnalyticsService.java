package com.flath.study.service;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.Month;
import java.time.ZoneId;
import java.time.format.TextStyle;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.flath.study.dto.response.StudyChartPointResponse;
import com.flath.study.dto.response.StudyLeaderboardEntryResponse;
import com.flath.study.dto.response.StudyStatsResponse;
import com.flath.study.dto.response.UserProfileResponse;
import com.flath.study.entity.StudySession;
import com.flath.study.repository.httpclient.ProfileClient;

import feign.FeignException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class StudyAnalyticsService {
    StudySessionService studySessionService;
    ProfileClient profileClient;
    StudyLeaderboardCacheService studyLeaderboardCacheService;

    public StudyStatsResponse getMyStats() {
        return buildStats(studySessionService.getCurrentUserSessions(), "week");
    }

    public StudyStatsResponse getMyStats(String chartType) {
        return buildStats(studySessionService.getCurrentUserSessions(), chartType);
    }

    public List<StudyLeaderboardEntryResponse> getGlobalLeaderboard(int limit) {
        return buildLeaderboard(limit, false);
    }

    public List<StudyLeaderboardEntryResponse> getWeeklyLeaderboard(int limit) {
        return buildLeaderboard(limit, true);
    }

    private List<StudyLeaderboardEntryResponse> buildLeaderboard(int limit, boolean weeklyOnly) {
        int safeLimit = Math.max(1, Math.min(limit, 100));
        List<String> rankedUserIds = weeklyOnly
                ? studyLeaderboardCacheService.getTopWeeklyUserIds(safeLimit)
                : studyLeaderboardCacheService.getTopGlobalUserIds(safeLimit);

        return rankedUserIds.stream()
                .map(this::buildLeaderboardEntry)
                .filter(entry -> weeklyOnly ? entry.getWeekSeconds() > 0 : entry.getTotalSeconds() > 0)
                .limit(safeLimit)
                .toList();
    }

    private StudyLeaderboardEntryResponse buildLeaderboardEntry(String userId) {
        StudyStatsResponse stats = buildStats(studySessionService.getSessionsForUser(userId), "week");
        UserProfileResponse profile = getProfile(userId);

        return StudyLeaderboardEntryResponse.builder()
                .userId(userId)
                .username(profile.getUsername())
                .firstName(profile.getFirstName())
                .lastName(profile.getLastName())
                .avatar(profile.getAvatar())
                .city(profile.getCity())
                .totalSeconds(studyLeaderboardCacheService.getGlobalScore(userId))
                .weekSeconds(studyLeaderboardCacheService.getWeeklyScore(userId))
                .streakDays(stats.getStreakDays())
                .build();
    }

    private UserProfileResponse getProfile(String userId) {
        try {
            var response = profileClient.getProfile(userId);
            if (response != null && response.getResult() != null) {
                return response.getResult();
            }
        } catch (FeignException exception) {
            // Ignore profile lookup failures and fall back to a minimal placeholder.
        }

        String shortUserId = userId.length() > 8 ? userId.substring(0, 8) : userId;
        return UserProfileResponse.builder()
                .userId(userId)
                .username("learner-" + shortUserId)
                .build();
    }

    private StudyStatsResponse buildStats(List<StudySession> sessions, String chartType) {
        ZoneId zoneId = ZoneId.systemDefault();
        LocalDate today = LocalDate.now(zoneId);
        LocalDate weekStart = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));

        long totalSeconds = 0;
        long todaySeconds = 0;
        long weekSeconds = 0;
        long monthSeconds = 0;
        long yearSeconds = 0;
        Map<LocalDate, Long> dailyTotals = new HashMap<>();

        for (StudySession session : sessions) {
            LocalDate sessionDate = Instant.ofEpochMilli(session.getStartedAt().toEpochMilli())
                    .atZone(zoneId)
                    .toLocalDate();
            long durationSeconds = session.getDurationSeconds();

            totalSeconds += durationSeconds;

            if (sessionDate.equals(today)) {
                todaySeconds += durationSeconds;
            }
            if (!sessionDate.isBefore(weekStart)) {
                weekSeconds += durationSeconds;
            }
            if (sessionDate.getMonth() == today.getMonth() && sessionDate.getYear() == today.getYear()) {
                monthSeconds += durationSeconds;
            }
            if (sessionDate.getYear() == today.getYear()) {
                yearSeconds += durationSeconds;
            }

            dailyTotals.merge(sessionDate, durationSeconds, Long::sum);
        }

        int streakDays = 0;
        for (int index = 0; index < 365; index += 1) {
            LocalDate currentDate = today.minusDays(index);
            if ((dailyTotals.get(currentDate) != null ? dailyTotals.get(currentDate) : 0L) > 0) {
                streakDays += 1;
            } else if (index > 0) {
                break;
            }
        }

        List<StudyChartPointResponse> chart = buildChart(dailyTotals, today, chartType);

        return StudyStatsResponse.builder()
                .totalSeconds(totalSeconds)
                .todaySeconds(todaySeconds)
                .weekSeconds(weekSeconds)
                .monthSeconds(monthSeconds)
                .yearSeconds(yearSeconds)
                .streakDays(streakDays)
                .chart(chart)
                .build();
    }

    private List<StudyChartPointResponse> buildChart(
            Map<LocalDate, Long> dailyTotals, LocalDate today, String chartType) {
        if ("month".equals(chartType)) {
            return buildMonthlyChart(dailyTotals, today);
        } else if ("year".equals(chartType)) {
            return buildYearlyChart(dailyTotals, today);
        }
        return buildWeeklyChart(dailyTotals, today);
    }

    private List<StudyChartPointResponse> buildWeeklyChart(Map<LocalDate, Long> dailyTotals, LocalDate today) {
        LocalDate monday = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        List<StudyChartPointResponse> result = new ArrayList<>();
        for (int index = 0; index < 7; index++) {
            LocalDate date = monday.plusDays(index);
            result.add(StudyChartPointResponse.builder()
                    .dateKey(date.toString())
                    .label(date.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.of("vi", "VN")))
                    .totalSeconds(dailyTotals.getOrDefault(date, 0L))
                    .build());
        }
        return result;
    }

    private List<StudyChartPointResponse> buildMonthlyChart(Map<LocalDate, Long> dailyTotals, LocalDate today) {
        int daysInMonth = today.lengthOfMonth();
        List<StudyChartPointResponse> result = new ArrayList<>();
        for (int day = 1; day <= daysInMonth; day++) {
            LocalDate date = today.withDayOfMonth(day);
            result.add(StudyChartPointResponse.builder()
                    .dateKey(date.toString())
                    .label(String.valueOf(day))
                    .totalSeconds(dailyTotals.getOrDefault(date, 0L))
                    .build());
        }
        return result;
    }

    private List<StudyChartPointResponse> buildYearlyChart(Map<LocalDate, Long> dailyTotals, LocalDate today) {
        List<StudyChartPointResponse> result = new ArrayList<>();
        for (int month = 1; month <= 12; month++) {
            Month m = Month.of(month);
            // Aggregate all days in this month
            long monthTotal = 0;
            int daysInMonth = java.time.YearMonth.of(today.getYear(), month).lengthOfMonth();
            for (int day = 1; day <= daysInMonth; day++) {
                LocalDate date = today.withMonth(month).withDayOfMonth(day);
                monthTotal += dailyTotals.getOrDefault(date, 0L);
            }
            result.add(StudyChartPointResponse.builder()
                    .dateKey(String.format("%d-%02d", today.getYear(), month))
                    .label(m.getDisplayName(TextStyle.SHORT, Locale.of("vi", "VN")))
                    .totalSeconds(monthTotal)
                    .build());
        }
        return result;
    }
}
