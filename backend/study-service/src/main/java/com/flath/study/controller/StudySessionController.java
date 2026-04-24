package com.flath.study.controller;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.flath.study.dto.ApiResponse;
import com.flath.study.dto.request.StudySessionCreationRequest;
import com.flath.study.dto.response.StudySessionResponse;
import com.flath.study.service.StudySessionService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/sessions")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class StudySessionController {
    StudySessionService studySessionService;

    @PostMapping
    ApiResponse<StudySessionResponse> create(@RequestBody @Valid StudySessionCreationRequest request) {
        return ApiResponse.<StudySessionResponse>builder()
                .result(studySessionService.create(request))
                .build();
    }

    @GetMapping("/my-sessions")
    ApiResponse<List<StudySessionResponse>> getMySessions(@RequestParam(defaultValue = "30") int limit) {
        return ApiResponse.<List<StudySessionResponse>>builder()
                .result(studySessionService.getMySessions(limit))
                .build();
    }
}
