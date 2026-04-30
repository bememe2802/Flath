package com.flath.post.repository.httpclient;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.flath.event.dto.PostPublishedEvent;
import com.flath.post.dto.ApiResponse;

@FeignClient(name = "notification-service", url = "${app.services.notification.url}")
public interface NotificationClient {
    @PostMapping("/internal/in-app-notifications/post-published")
    ApiResponse<Void> createPostPublishedNotifications(@RequestBody PostPublishedEvent event);
}
