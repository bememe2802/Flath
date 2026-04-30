package com.flath.notification.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.flath.event.dto.PostPublishedEvent;
import com.flath.notification.dto.ApiResponse;
import com.flath.notification.service.InAppNotificationService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class InternalInAppNotificationController {
    InAppNotificationService inAppNotificationService;

    @PostMapping("/internal/in-app-notifications/post-published")
    ApiResponse<Void> createPostPublishedNotifications(@RequestBody PostPublishedEvent event) {
        inAppNotificationService.createNotificationsForPost(event);
        return ApiResponse.<Void>builder().build();
    }
}
