package com.flath.newsfeed.dto.response;

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
public class NewsfeedItemResponse {
    String id;
    String content;
    String userId;
    String username;
    String firstName;
    String lastName;
    String avatar;
    String city;
    int likeCount;
    int commentCount;
    int shareCount;
    boolean likedByMe;
    String sharedPostId;
    NewsfeedItemResponse sharedPost;
    String created;
    Instant createdDate;
    Instant modifiedDate;
}
