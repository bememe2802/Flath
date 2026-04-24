package com.flath.study.repository;

import java.time.Instant;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.flath.study.entity.StudySession;

@Repository
public interface StudySessionRepository extends JpaRepository<StudySession, String> {
    List<StudySession> findAllByUserIdOrderByStartedAtDesc(String userId);

    List<StudySession> findAllByStartedAtAfter(Instant startedAt);
}
