package com.flath.study.entity;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

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
@Entity
@Table(
        name = "study_session",
        indexes = {
            @Index(name = "idx_study_session_user_started", columnList = "userId,startedAt"),
            @Index(name = "idx_study_session_started_at", columnList = "startedAt")
        })
public class StudySession {
    @Id
    String id;

    @Column(nullable = false)
    String userId;

    @Column(nullable = false)
    Instant startedAt;

    @Column(nullable = false)
    Instant endedAt;

    @Column(nullable = false)
    long durationSeconds;

    String focusLabel;

    @Column(nullable = false, updatable = false)
    Instant createdDate;

    @PrePersist
    void prePersist() {
        if (createdDate == null) {
            createdDate = Instant.now();
        }
    }
}
