package com.flath.study.service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.WeekFields;
import java.util.List;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import com.flath.study.entity.StudySession;
import com.flath.study.repository.StudySessionRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class StudyLeaderboardCacheService {
    String GLOBAL_KEY = "study:leaderboard:global";
    String WARM_MARKER_KEY = "study:leaderboard:warmed";
    String WEEKLY_WARM_MARKER_PREFIX = "study:leaderboard:weekly:warmed:";

    StringRedisTemplate redisTemplate;
    StudySessionRepository studySessionRepository;

    public void recordSession(StudySession session) {
        redisTemplate.opsForZSet().incrementScore(GLOBAL_KEY, session.getUserId(), session.getDurationSeconds());
        redisTemplate
                .opsForZSet()
                .incrementScore(
                        buildWeeklyKey(session.getStartedAt()), session.getUserId(), session.getDurationSeconds());
        redisTemplate.opsForValue().set(WARM_MARKER_KEY, "1");
        redisTemplate.opsForValue().set(buildWeeklyWarmMarker(session.getStartedAt()), "1");
    }

    public List<String> getTopGlobalUserIds(int limit) {
        warmUpIfNeeded();
        var userIds = redisTemplate.opsForZSet().reverseRange(GLOBAL_KEY, 0, Math.max(0, limit - 1L));
        return userIds == null ? List.of() : userIds.stream().toList();
    }

    public List<String> getTopWeeklyUserIds(int limit) {
        warmUpIfNeeded();
        var userIds =
                redisTemplate.opsForZSet().reverseRange(buildWeeklyKey(Instant.now()), 0, Math.max(0, limit - 1L));
        return userIds == null ? List.of() : userIds.stream().toList();
    }

    public long getGlobalScore(String userId) {
        warmUpIfNeeded();
        Double score = redisTemplate.opsForZSet().score(GLOBAL_KEY, userId);
        return score == null ? 0L : score.longValue();
    }

    public long getWeeklyScore(String userId) {
        warmUpIfNeeded();
        Double score = redisTemplate.opsForZSet().score(buildWeeklyKey(Instant.now()), userId);
        return score == null ? 0L : score.longValue();
    }

    private void warmUpIfNeeded() {
        boolean globalWarmed = Boolean.TRUE.equals(redisTemplate.hasKey(WARM_MARKER_KEY));
        boolean weeklyWarmed = Boolean.TRUE.equals(redisTemplate.hasKey(buildWeeklyWarmMarker(Instant.now())));
        if (globalWarmed && weeklyWarmed) {
            return;
        }

        List<StudySession> sessions = studySessionRepository.findAll();
        if (sessions.isEmpty()) {
            if (!globalWarmed) {
                redisTemplate.opsForValue().set(WARM_MARKER_KEY, "1");
            }
            if (!weeklyWarmed) {
                redisTemplate.opsForValue().set(buildWeeklyWarmMarker(Instant.now()), "1");
            }
            return;
        }

        var zSetOperations = redisTemplate.opsForZSet();
        for (StudySession session : sessions) {
            if (!globalWarmed) {
                zSetOperations.incrementScore(GLOBAL_KEY, session.getUserId(), session.getDurationSeconds());
            }
            if (!weeklyWarmed && isInCurrentWeek(session.getStartedAt())) {
                zSetOperations.incrementScore(
                        buildWeeklyKey(Instant.now()), session.getUserId(), session.getDurationSeconds());
            }
        }
        if (!globalWarmed) {
            redisTemplate.opsForValue().set(WARM_MARKER_KEY, "1");
        }
        if (!weeklyWarmed) {
            redisTemplate.opsForValue().set(buildWeeklyWarmMarker(Instant.now()), "1");
        }
    }

    private boolean isInCurrentWeek(Instant instant) {
        LocalDate currentDate = LocalDate.now(ZoneId.systemDefault());
        LocalDate targetDate = instant.atZone(ZoneId.systemDefault()).toLocalDate();
        WeekFields weekFields = WeekFields.ISO;
        return currentDate.getYear() == targetDate.getYear()
                && currentDate.get(weekFields.weekOfWeekBasedYear())
                        == targetDate.get(weekFields.weekOfWeekBasedYear());
    }

    private String buildWeeklyKey(Instant instant) {
        LocalDate date = instant.atZone(ZoneId.systemDefault()).toLocalDate();
        WeekFields weekFields = WeekFields.ISO;
        int week = date.get(weekFields.weekOfWeekBasedYear());
        int weekBasedYear = date.get(weekFields.weekBasedYear());
        return "study:leaderboard:weekly:" + weekBasedYear + "-" + week;
    }

    private String buildWeeklyWarmMarker(Instant instant) {
        return WEEKLY_WARM_MARKER_PREFIX + buildWeeklyKey(instant);
    }
}
