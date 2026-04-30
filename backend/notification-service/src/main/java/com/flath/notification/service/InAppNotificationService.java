package com.flath.notification.service;

import java.time.Instant;
import java.util.List;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.flath.event.dto.PostPublishedEvent;
import com.flath.notification.dto.response.InAppNotificationResponse;
import com.flath.notification.dto.response.NotificationFeedResponse;
import com.flath.notification.entity.InAppNotification;
import com.flath.notification.repository.InAppNotificationRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class InAppNotificationService {
    InAppNotificationRepository inAppNotificationRepository;
    NotificationUnreadCacheService notificationUnreadCacheService;

    public void createNotificationsForPost(PostPublishedEvent event) {
        if (event.getRecipientUserIds() == null || event.getRecipientUserIds().isEmpty()) {
            return;
        }

        Instant createdDate = event.getCreatedDate() != null ? event.getCreatedDate() : Instant.now();
        String title = buildTitle(event);
        String message = buildMessage(event);

        List<InAppNotification> notifications = event.getRecipientUserIds().stream()
                .filter(recipientUserId -> !notificationExists(event.getPostId(), recipientUserId))
                .map(recipientUserId -> InAppNotification.builder()
                        .eventKey(buildEventKey(event.getPostId(), recipientUserId))
                        .recipientUserId(recipientUserId)
                        .actorUserId(event.getAuthorUserId())
                        .actorUsername(event.getAuthorUsername())
                        .actorFirstName(event.getAuthorFirstName())
                        .actorLastName(event.getAuthorLastName())
                        .actorAvatar(event.getAuthorAvatar())
                        .type("POST_PUBLISHED")
                        .title(title)
                        .message(message)
                        .postId(event.getPostId())
                        .read(false)
                        .createdDate(createdDate)
                        .build())
                .toList();

        if (notifications.isEmpty()) {
            return;
        }

        inAppNotificationRepository.saveAll(notifications);
        notificationUnreadCacheService.incrementUnread(notifications.stream()
                .map(InAppNotification::getRecipientUserId)
                .toList());
    }

    public NotificationFeedResponse getMyNotifications() {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        List<InAppNotificationResponse> notifications =
                inAppNotificationRepository.findTop20ByRecipientUserIdOrderByCreatedDateDesc(userId).stream()
                        .map(this::toResponse)
                        .toList();

        long unreadCount = notificationUnreadCacheService.getUnreadCount(userId);
        if (unreadCount < 0) {
            unreadCount = inAppNotificationRepository.countByRecipientUserIdAndReadFalse(userId);
            notificationUnreadCacheService.setUnreadCount(userId, unreadCount);
        }

        return NotificationFeedResponse.builder()
                .data(notifications)
                .unreadCount(unreadCount)
                .build();
    }

    public void markAllAsRead() {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        List<InAppNotification> unreadNotifications =
                inAppNotificationRepository.findAllByRecipientUserIdAndReadFalse(userId);

        if (unreadNotifications.isEmpty()) {
            return;
        }

        unreadNotifications.forEach(notification -> notification.setRead(true));
        inAppNotificationRepository.saveAll(unreadNotifications);
        notificationUnreadCacheService.setUnreadCount(userId, 0L);
    }

    private InAppNotificationResponse toResponse(InAppNotification notification) {
        return InAppNotificationResponse.builder()
                .id(notification.getId())
                .actorUserId(notification.getActorUserId())
                .actorUsername(notification.getActorUsername())
                .actorFirstName(notification.getActorFirstName())
                .actorLastName(notification.getActorLastName())
                .actorAvatar(notification.getActorAvatar())
                .type(notification.getType())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .postId(notification.getPostId())
                .read(notification.isRead())
                .createdDate(notification.getCreatedDate())
                .build();
    }

    private String buildTitle(PostPublishedEvent event) {
        String displayName = buildDisplayName(event);
        return displayName + " posted a new update";
    }

    private String buildMessage(PostPublishedEvent event) {
        String preview = event.getContentPreview();
        if (preview == null || preview.isBlank()) {
            return "A new post is waiting in your feed.";
        }

        return preview;
    }

    private String buildDisplayName(PostPublishedEvent event) {
        String firstName =
                event.getAuthorFirstName() != null ? event.getAuthorFirstName().trim() : "";
        String lastName =
                event.getAuthorLastName() != null ? event.getAuthorLastName().trim() : "";
        String fullName = (lastName + " " + firstName).trim();
        return fullName.isBlank() ? event.getAuthorUsername() : fullName;
    }

    private boolean notificationExists(String postId, String recipientUserId) {
        return inAppNotificationRepository.existsByEventKey(buildEventKey(postId, recipientUserId));
    }

    private String buildEventKey(String postId, String recipientUserId) {
        return "POST_PUBLISHED:" + postId + ":" + recipientUserId;
    }
}
