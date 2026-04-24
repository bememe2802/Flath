package com.flath.newsfeed.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.flath.newsfeed.dto.ApiResponse;
import com.flath.newsfeed.dto.PageResponse;
import com.flath.newsfeed.dto.response.NewsfeedItemResponse;
import com.flath.newsfeed.service.NewsfeedService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/feed")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class NewsfeedController {
    NewsfeedService newsfeedService;

    @GetMapping
    ApiResponse<PageResponse<NewsfeedItemResponse>> getFeed(
            @RequestParam(value = "page", required = false, defaultValue = "1") int page,
            @RequestParam(value = "size", required = false, defaultValue = "20") int size) {
        return ApiResponse.<PageResponse<NewsfeedItemResponse>>builder()
                .result(newsfeedService.getFeed(page, size))
                .build();
    }
}
