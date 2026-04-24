package com.flath.study.dto.response;

import java.util.List;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class StudyStatsResponse {
    long totalSeconds;
    long todaySeconds;
    long weekSeconds;
    long monthSeconds;
    long yearSeconds;
    int streakDays;
    List<StudyChartPointResponse> chart;
}
