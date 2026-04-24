package com.flath.study.dto.response;

import java.time.Instant;

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
public class StudySessionResponse {
    String id;
    String userId;
    Instant startedAt;
    Instant endedAt;
    long durationSeconds;
    String focusLabel;
    Instant createdDate;
}
