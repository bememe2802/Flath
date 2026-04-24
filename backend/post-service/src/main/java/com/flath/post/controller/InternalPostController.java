package com.flath.post.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.flath.post.dto.ApiResponse;
import com.flath.post.dto.PageResponse;
import com.flath.post.dto.response.PostResponse;
import com.flath.post.service.PostService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/internal/posts")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class InternalPostController {
    PostService postService;

    @GetMapping("/feed")
    ApiResponse<PageResponse<PostResponse>> getLatestPosts(
            @RequestParam(value = "page", required = false, defaultValue = "1") int page,
            @RequestParam(value = "size", required = false, defaultValue = "20") int size) {
        return ApiResponse.<PageResponse<PostResponse>>builder()
                .result(postService.getLatestPosts(page, size))
                .build();
    }
}
