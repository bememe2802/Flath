package com.flath.post.dto.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PostResponse {
    String id;
    String content;
    String userId;
    String username;
    int likeCount;
    int commentCount;
    int shareCount;
    boolean likedByMe;
    String sharedPostId;
    PostResponse sharedPost;
    String created;
    Instant createdDate;
    Instant modifiedDate;
}
