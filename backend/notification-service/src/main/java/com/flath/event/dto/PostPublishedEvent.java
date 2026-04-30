package com.flath.event.dto;

import java.time.Instant;
import java.util.List;

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
public class PostPublishedEvent {
    String postId;
    String authorUserId;
    String authorUsername;
    String authorFirstName;
    String authorLastName;
    String authorAvatar;
    String contentPreview;
    Instant createdDate;
    List<String> recipientUserIds;
}
