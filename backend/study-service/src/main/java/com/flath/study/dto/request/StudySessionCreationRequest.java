package com.flath.study.dto.request;

import java.time.Instant;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

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
public class StudySessionCreationRequest {
    @NotNull(message = "INVALID_STUDY_SESSION")
    Instant startedAt;

    @NotNull(message = "INVALID_STUDY_SESSION")
    Instant endedAt;

    @Size(max = 120, message = "INVALID_FOCUS_LABEL")
    String focusLabel;
}
