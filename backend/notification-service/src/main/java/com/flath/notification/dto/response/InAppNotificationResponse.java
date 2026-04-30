package com.flath.notification.dto.response;

import java.time.Instant;

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
public class InAppNotificationResponse {
    String id;
    String actorUserId;
    String actorUsername;
    String actorFirstName;
    String actorLastName;
    String actorAvatar;
    String type;
    String title;
    String message;
    String postId;
    boolean read;
    Instant createdDate;
}
