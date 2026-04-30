package com.flath.newsfeed.service;

import java.util.HashMap;
import java.util.Map;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.flath.newsfeed.dto.PageResponse;
import com.flath.newsfeed.dto.response.NewsfeedItemResponse;
import com.flath.newsfeed.dto.response.PostResponse;
import com.flath.newsfeed.dto.response.UserProfileResponse;
import com.flath.newsfeed.repository.httpclient.PostClient;
import com.flath.newsfeed.repository.httpclient.ProfileClient;

import feign.FeignException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class NewsfeedService {
    PostClient postClient;
    ProfileClient profileClient;
    NewsfeedCacheService newsfeedCacheService;

    public PageResponse<NewsfeedItemResponse> getFeed(int page, int size) {
        int safePage = Math.max(page, 1);
        int safeSize = Math.min(Math.max(size, 1), 50);
        String viewerUserId =
                SecurityContextHolder.getContext().getAuthentication().getName();

        var cachedFeed = newsfeedCacheService.getFeed(viewerUserId, safePage, safeSize);
        if (cachedFeed.isPresent()) {
            return cachedFeed.get();
        }

        var response = postClient.getFeed(safePage, safeSize).getResult();
        Map<String, UserProfileResponse> profiles = new HashMap<>();

        var items = response.getData().stream()
                .map(post -> toNewsfeedItem(post, profiles))
                .toList();

        PageResponse<NewsfeedItemResponse> feed = PageResponse.<NewsfeedItemResponse>builder()
                .currentPage(response.getCurrentPage())
                .pageSize(response.getPageSize())
                .totalPages(response.getTotalPages())
                .totalElements(response.getTotalElements())
                .data(items)
                .build();
        newsfeedCacheService.putFeed(viewerUserId, safePage, safeSize, feed);
        return feed;
    }

    private NewsfeedItemResponse toNewsfeedItem(PostResponse post, Map<String, UserProfileResponse> profiles) {
        UserProfileResponse profile = profiles.computeIfAbsent(post.getUserId(), this::fetchProfile);

        return NewsfeedItemResponse.builder()
                .id(post.getId())
                .content(post.getContent())
                .userId(post.getUserId())
                .username(profile.getUsername() != null ? profile.getUsername() : post.getUsername())
                .firstName(profile.getFirstName())
                .lastName(profile.getLastName())
                .avatar(profile.getAvatar())
                .city(profile.getCity())
                .likeCount(post.getLikeCount())
                .commentCount(post.getCommentCount())
                .shareCount(post.getShareCount())
                .likedByMe(post.isLikedByMe())
                .sharedPostId(post.getSharedPostId())
                .sharedPost(post.getSharedPost() != null ? toNewsfeedItem(post.getSharedPost(), profiles) : null)
                .created(post.getCreated())
                .createdDate(post.getCreatedDate())
                .modifiedDate(post.getModifiedDate())
                .build();
    }

    private UserProfileResponse fetchProfile(String userId) {
        try {
            var response = profileClient.getProfile(userId);
            if (response != null && response.getResult() != null) {
                return response.getResult();
            }
        } catch (FeignException exception) {
        }

        return UserProfileResponse.builder().userId(userId).username("learner").build();
    }
}
