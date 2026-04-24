package com.flath.study.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.flath.study.dto.ApiResponse;
import com.flath.study.dto.response.StudyLeaderboardEntryResponse;
import com.flath.study.dto.response.StudyStatsResponse;
import com.flath.study.service.StudyAnalyticsService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class StudyAnalyticsController {
    StudyAnalyticsService studyAnalyticsService;

    @GetMapping("/stats/my-stats")
    ApiResponse<StudyStatsResponse> getMyStats() {
        return ApiResponse.<StudyStatsResponse>builder()
                .result(studyAnalyticsService.getMyStats())
                .build();
    }

    @GetMapping("/leaderboard/global")
    ApiResponse<List<StudyLeaderboardEntryResponse>> getGlobalLeaderboard(
            @RequestParam(defaultValue = "20") int limit) {
        return ApiResponse.<List<StudyLeaderboardEntryResponse>>builder()
                .result(studyAnalyticsService.getGlobalLeaderboard(limit))
                .build();
    }

    @GetMapping("/leaderboard/weekly")
    ApiResponse<List<StudyLeaderboardEntryResponse>> getWeeklyLeaderboard(
            @RequestParam(defaultValue = "20") int limit) {
        return ApiResponse.<List<StudyLeaderboardEntryResponse>>builder()
                .result(studyAnalyticsService.getWeeklyLeaderboard(limit))
                .build();
    }
}
