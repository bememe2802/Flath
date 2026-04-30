package com.flath.notification.entity;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

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
@Document(collection = "in_app_notifications")
public class InAppNotification {
    @Id
    String id;

    String eventKey;
    String recipientUserId;
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
