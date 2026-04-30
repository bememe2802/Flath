package com.flath.post.entity;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Builder.Default;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PostComment {
    String id;
    String userId;
    String content;
    String parentCommentId;
    @Default
    Set<String> likedUserIds = new HashSet<>();
    @Default
    List<PostComment> replies = new ArrayList<>();
    Instant createdDate;
}
