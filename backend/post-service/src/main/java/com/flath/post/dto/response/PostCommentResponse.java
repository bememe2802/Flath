package com.flath.post.dto.response;

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
public class PostCommentResponse {
    String id;
    String postId;
    String userId;
    String parentCommentId;
    String username;
    String firstName;
    String lastName;
    String avatar;
    String content;
    int likeCount;
    boolean likedByMe;
    List<PostCommentResponse> replies;
    String created;
    Instant createdDate;
}
