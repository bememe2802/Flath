package com.flath.study.service;

import java.time.Duration;
import java.util.List;
import java.util.UUID;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.flath.study.dto.request.StudySessionCreationRequest;
import com.flath.study.dto.response.StudySessionResponse;
import com.flath.study.entity.StudySession;
import com.flath.study.exception.AppException;
import com.flath.study.exception.ErrorCode;
import com.flath.study.repository.StudySessionRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class StudySessionService {
    StudySessionRepository studySessionRepository;

    public StudySessionResponse create(StudySessionCreationRequest request) {
        long durationSeconds =
                Duration.between(request.getStartedAt(), request.getEndedAt()).getSeconds();

        if (durationSeconds <= 0) {
            throw new AppException(ErrorCode.INVALID_STUDY_SESSION);
        }

        StudySession studySession = StudySession.builder()
                .id(UUID.randomUUID().toString())
                .userId(getCurrentUserId())
                .startedAt(request.getStartedAt())
                .endedAt(request.getEndedAt())
                .durationSeconds(durationSeconds)
                .focusLabel(normalizeFocusLabel(request.getFocusLabel()))
                .build();

        return toResponse(studySessionRepository.save(studySession));
    }

    public List<StudySessionResponse> getMySessions(int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 200));

        return studySessionRepository.findAllByUserIdOrderByStartedAtDesc(getCurrentUserId()).stream()
                .limit(safeLimit)
                .map(this::toResponse)
                .toList();
    }

    List<StudySession> getCurrentUserSessions() {
        return studySessionRepository.findAllByUserIdOrderByStartedAtDesc(getCurrentUserId());
    }

    private StudySessionResponse toResponse(StudySession studySession) {
        return StudySessionResponse.builder()
                .id(studySession.getId())
                .userId(studySession.getUserId())
                .startedAt(studySession.getStartedAt())
                .endedAt(studySession.getEndedAt())
                .durationSeconds(studySession.getDurationSeconds())
                .focusLabel(studySession.getFocusLabel())
                .createdDate(studySession.getCreatedDate())
                .build();
    }

    private String getCurrentUserId() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    private String normalizeFocusLabel(String focusLabel) {
        if (focusLabel == null || focusLabel.isBlank()) {
            return "Focus session";
        }

        return focusLabel.trim();
    }
}
