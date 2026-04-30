package com.flath.notification.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import com.flath.notification.dto.ApiResponse;
import com.flath.notification.dto.response.NotificationFeedResponse;
import com.flath.notification.service.InAppNotificationService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class InAppNotificationController {
    InAppNotificationService inAppNotificationService;

    @GetMapping("/my-notifications")
    ApiResponse<NotificationFeedResponse> getMyNotifications() {
        return ApiResponse.<NotificationFeedResponse>builder()
                .result(inAppNotificationService.getMyNotifications())
                .build();
    }

    @PostMapping("/my-notifications/read-all")
    ApiResponse<Void> markAllAsRead() {
        inAppNotificationService.markAllAsRead();
        return ApiResponse.<Void>builder().build();
    }
}
