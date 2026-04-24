package com.flath.study.service;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.TextStyle;
import java.time.temporal.TemporalAdjusters;
import java.util.Comparator;
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
import com.flath.study.repository.StudySessionRepository;
import com.flath.study.repository.httpclient.ProfileClient;

import feign.FeignException;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class StudyAnalyticsService {
    StudySessionRepository studySessionRepository;
    StudySessionService studySessionService;
    ProfileClient profileClient;

    public StudyStatsResponse getMyStats() {
        return buildStats(studySessionService.getCurrentUserSessions());
    }

    public List<StudyLeaderboardEntryResponse> getGlobalLeaderboard(int limit) {
        return buildLeaderboard(limit, false);
    }

    public List<StudyLeaderboardEntryResponse> getWeeklyLeaderboard(int limit) {
        return buildLeaderboard(limit, true);
    }

    private List<StudyLeaderboardEntryResponse> buildLeaderboard(int limit, boolean weeklyOnly) {
        int safeLimit = Math.max(1, Math.min(limit, 100));
        Map<String, List<StudySession>> sessionsByUser = new HashMap<>();

        for (StudySession session : studySessionRepository.findAll()) {
            sessionsByUser
                    .computeIfAbsent(session.getUserId(), ignored -> new java.util.ArrayList<>())
                    .add(session);
        }

        Comparator<StudyLeaderboardEntryResponse> comparator = weeklyOnly
                ? Comparator.comparingLong(StudyLeaderboardEntryResponse::getWeekSeconds)
                        .thenComparingLong(StudyLeaderboardEntryResponse::getTotalSeconds)
                        .thenComparingInt(StudyLeaderboardEntryResponse::getStreakDays)
                        .reversed()
                : Comparator.comparingLong(StudyLeaderboardEntryResponse::getTotalSeconds)
                        .thenComparingLong(StudyLeaderboardEntryResponse::getWeekSeconds)
                        .thenComparingInt(StudyLeaderboardEntryResponse::getStreakDays)
                        .reversed();

        return sessionsByUser.entrySet().stream()
                .map(entry -> {
                    StudyStatsResponse stats = buildStats(entry.getValue());
                    UserProfileResponse profile = getProfile(entry.getKey());

                    return StudyLeaderboardEntryResponse.builder()
                            .userId(entry.getKey())
                            .username(profile.getUsername())
                            .firstName(profile.getFirstName())
                            .lastName(profile.getLastName())
                            .avatar(profile.getAvatar())
                            .city(profile.getCity())
                            .totalSeconds(stats.getTotalSeconds())
                            .weekSeconds(stats.getWeekSeconds())
                            .streakDays(stats.getStreakDays())
                            .build();
                })
                .filter(entry -> weeklyOnly ? entry.getWeekSeconds() > 0 : entry.getTotalSeconds() > 0)
                .sorted(comparator)
                .limit(safeLimit)
                .toList();
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

    private StudyStatsResponse buildStats(List<StudySession> sessions) {
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

        List<StudyChartPointResponse> chart = java.util.stream.IntStream.rangeClosed(0, 6)
                .mapToObj(index -> {
                    LocalDate date = today.minusDays(6L - index);
                    return StudyChartPointResponse.builder()
                            .dateKey(date.toString())
                            .label(date.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.ENGLISH))
                            .totalSeconds(dailyTotals.getOrDefault(date, 0L))
                            .build();
                })
                .toList();

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

    @Builder
    private record StudyAggregate(
            long totalSeconds,
            long todaySeconds,
            long weekSeconds,
            long monthSeconds,
            long yearSeconds,
            int streakDays,
            List<StudyChartPointResponse> chart) {}
}
