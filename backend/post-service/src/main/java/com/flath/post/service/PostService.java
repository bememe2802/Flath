package com.flath.post.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.flath.event.dto.PostPublishedEvent;
import com.flath.post.dto.PageResponse;
import com.flath.post.dto.request.CommentRequest;
import com.flath.post.dto.request.PostRequest;
import com.flath.post.dto.request.SharePostRequest;
import com.flath.post.dto.response.PostCommentResponse;
import com.flath.post.dto.response.PostReactionResponse;
import com.flath.post.dto.response.PostResponse;
import com.flath.post.dto.response.UserProfileResponse;
import com.flath.post.entity.Post;
import com.flath.post.entity.PostComment;
import com.flath.post.exception.AppException;
import com.flath.post.exception.ErrorCode;
import com.flath.post.mapper.PostMapper;
import com.flath.post.repository.PostRepository;
import com.flath.post.repository.httpclient.NotificationClient;
import com.flath.post.repository.httpclient.ProfileClient;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PostService {
    DateTimeFormatter dateTimeFormatter;
    PostRepository postRepository;
    PostMapper postMapper;
    ProfileClient profileClient;
    NotificationClient notificationClient;
    KafkaTemplate<String, Object> kafkaTemplate;

    public PostResponse createPost(PostRequest request) {
        String userId = getCurrentUserId();
        Instant now = Instant.now();

        Post post = Post.builder()
                .content(trimToNull(request.getContent()))
                .userId(userId)
                .sharedPostId(request.getSharedPostId())
                .createdDate(now)
                .modifiedDate(now)
                .build();

        post = postRepository.save(post);
        PostResponse postResponse = mapPosts(List.of(post), userId).getFirst();
        publishPostNotification(post, postResponse);
        return postResponse;
    }

    public PageResponse<PostResponse> getMyPosts(int page, int size) {
        String userId = getCurrentUserId();
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by("createdDate").descending());
        Page<Post> pageData = postRepository.findAllByUserId(userId, pageable);

        return buildPageResponse(pageData, page, userId);
    }

    public PageResponse<PostResponse> getLatestPosts(int page, int size) {
        String viewerUserId = getCurrentUserIdOrNull();
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by("createdDate").descending());
        Page<Post> pageData = postRepository.findAll(pageable);

        return buildPageResponse(pageData, page, viewerUserId);
    }

    public PostReactionResponse toggleLike(String postId) {
        String userId = getCurrentUserId();
        Post post = getPost(postId);

        Set<String> likedUserIds = post.getLikedUserIds();
        if (likedUserIds == null) {
            likedUserIds = new HashSet<>();
            post.setLikedUserIds(likedUserIds);
        }

        boolean liked;
        if (likedUserIds.contains(userId)) {
            likedUserIds.remove(userId);
            liked = false;
        } else {
            likedUserIds.add(userId);
            liked = true;
        }

        post.setModifiedDate(Instant.now());
        postRepository.save(post);

        return PostReactionResponse.builder()
                .liked(liked)
                .likeCount(likedUserIds.size())
                .build();
    }

    public List<PostCommentResponse> getComments(String postId) {
        Post post = getPost(postId);
        List<PostComment> comments = post.getComments() != null ? post.getComments() : List.of();
        Map<String, UserProfileResponse> profiles = new HashMap<>();

        return comments.stream()
                .sorted((left, right) -> left.getCreatedDate().compareTo(right.getCreatedDate()))
                .map(comment -> mapComment(post.getId(), comment, profiles))
                .toList();
    }

    public PostCommentResponse addComment(String postId, CommentRequest request) {
        String userId = getCurrentUserId();
        Post post = getPost(postId);
        String content = trimToNull(request.getContent());

        if (content == null) {
            throw new AppException(ErrorCode.COMMENT_INVALID);
        }

        PostComment comment = PostComment.builder()
                .id(UUID.randomUUID().toString())
                .userId(userId)
                .content(content)
                .parentCommentId(null)
                .createdDate(Instant.now())
                .build();

        List<PostComment> comments = post.getComments();
        if (comments == null) {
            comments = new ArrayList<>();
            post.setComments(comments);
        }

        comments.add(comment);
        post.setModifiedDate(Instant.now());
        postRepository.save(post);

        return mapComment(post.getId(), comment, new HashMap<>());
    }

    public PostReactionResponse toggleCommentLike(String postId, String commentId) {
        String userId = getCurrentUserId();
        Post post = getPost(postId);
        PostComment comment = findComment(post.getComments(), commentId);

        if (comment == null) {
            throw new AppException(ErrorCode.COMMENT_INVALID);
        }

        Set<String> likedUserIds = comment.getLikedUserIds();
        if (likedUserIds == null) {
            likedUserIds = new HashSet<>();
            comment.setLikedUserIds(likedUserIds);
        }

        boolean liked;
        if (likedUserIds.contains(userId)) {
            likedUserIds.remove(userId);
            liked = false;
        } else {
            likedUserIds.add(userId);
            liked = true;
        }

        post.setModifiedDate(Instant.now());
        postRepository.save(post);

        return PostReactionResponse.builder()
                .liked(liked)
                .likeCount(likedUserIds.size())
                .build();
    }

    public PostCommentResponse replyToComment(String postId, String commentId, CommentRequest request) {
        String userId = getCurrentUserId();
        Post post = getPost(postId);
        PostComment parentComment = findComment(post.getComments(), commentId);
        String content = trimToNull(request.getContent());

        if (parentComment == null || content == null) {
            throw new AppException(ErrorCode.COMMENT_INVALID);
        }

        PostComment reply = PostComment.builder()
                .id(UUID.randomUUID().toString())
                .userId(userId)
                .content(content)
                .parentCommentId(commentId)
                .createdDate(Instant.now())
                .build();

        List<PostComment> replies = parentComment.getReplies();
        if (replies == null) {
            replies = new ArrayList<>();
            parentComment.setReplies(replies);
        }

        replies.add(reply);
        post.setModifiedDate(Instant.now());
        postRepository.save(post);
        return mapComment(post.getId(), reply, new HashMap<>());
    }

    public PostResponse sharePost(String postId, SharePostRequest request) {
        String userId = getCurrentUserId();
        Post targetPost = getPost(postId);
        String rootPostId = targetPost.getSharedPostId() != null ? targetPost.getSharedPostId() : targetPost.getId();
        Instant now = Instant.now();

        Post sharedPost = Post.builder()
                .content(trimToNull(request.getContent()))
                .userId(userId)
                .sharedPostId(rootPostId)
                .createdDate(now)
                .modifiedDate(now)
                .build();

        sharedPost = postRepository.save(sharedPost);

        if (!rootPostId.equals(sharedPost.getId())) {
            Post originalPost = getPost(rootPostId);
            originalPost.setShareCount(originalPost.getShareCount() + 1);
            originalPost.setModifiedDate(now);
            postRepository.save(originalPost);
        }

        return mapPosts(List.of(sharedPost), userId).getFirst();
    }

    private PageResponse<PostResponse> buildPageResponse(Page<Post> pageData, int page, String viewerUserId) {
        return PageResponse.<PostResponse>builder()
                .currentPage(page)
                .pageSize(pageData.getSize())
                .totalPages(pageData.getTotalPages())
                .totalElements(pageData.getTotalElements())
                .data(mapPosts(pageData.getContent(), viewerUserId))
                .build();
    }

    private List<PostResponse> mapPosts(List<Post> posts, String viewerUserId) {
        Map<String, Post> sharedPosts = loadSharedPosts(posts);
        Map<String, UserProfileResponse> profiles = new HashMap<>();

        return posts.stream()
                .map(post -> toPostResponse(post, viewerUserId, sharedPosts, profiles, true))
                .toList();
    }

    private Map<String, Post> loadSharedPosts(List<Post> posts) {
        Set<String> sharedPostIds = posts.stream()
                .map(Post::getSharedPostId)
                .filter(Objects::nonNull)
                .collect(HashSet::new, Set::add, Set::addAll);

        if (sharedPostIds.isEmpty()) {
            return Map.of();
        }

        Map<String, Post> sharedPosts = new HashMap<>();
        postRepository.findAllById(sharedPostIds).forEach(post -> sharedPosts.put(post.getId(), post));
        return sharedPosts;
    }

    private PostResponse toPostResponse(
            Post post,
            String viewerUserId,
            Map<String, Post> sharedPosts,
            Map<String, UserProfileResponse> profiles,
            boolean includeSharedPost) {
        PostResponse postResponse = postMapper.toPostResponse(post);
        UserProfileResponse profile = getUserProfile(post.getUserId(), profiles);
        Set<String> likedUserIds = post.getLikedUserIds() != null ? post.getLikedUserIds() : Set.of();
        List<PostComment> comments = post.getComments() != null ? post.getComments() : List.of();

        postResponse.setUsername(profile != null ? profile.getUsername() : null);
        postResponse.setCreated(dateTimeFormatter.format(post.getCreatedDate()));
        postResponse.setLikeCount(likedUserIds.size());
        postResponse.setCommentCount(countComments(comments));
        postResponse.setShareCount(post.getShareCount());
        postResponse.setLikedByMe(viewerUserId != null && likedUserIds.contains(viewerUserId));
        postResponse.setSharedPostId(post.getSharedPostId());

        if (includeSharedPost && post.getSharedPostId() != null) {
            Post sharedPost = sharedPosts.get(post.getSharedPostId());
            if (sharedPost != null) {
                postResponse.setSharedPost(toPostResponse(sharedPost, viewerUserId, sharedPosts, profiles, false));
            }
        }

        return postResponse;
    }

    private PostCommentResponse mapComment(String postId, PostComment comment, Map<String, UserProfileResponse> profiles) {
        UserProfileResponse profile = getUserProfile(comment.getUserId(), profiles);
        String viewerUserId = getCurrentUserIdOrNull();
        Set<String> likedUserIds = comment.getLikedUserIds() != null ? comment.getLikedUserIds() : Set.of();
        List<PostCommentResponse> replies = (comment.getReplies() != null ? comment.getReplies() : List.<PostComment>of())
                .stream()
                .sorted((left, right) -> left.getCreatedDate().compareTo(right.getCreatedDate()))
                .map(reply -> mapComment(postId, reply, profiles))
                .toList();

        return PostCommentResponse.builder()
                .id(comment.getId())
                .postId(postId)
                .userId(comment.getUserId())
                .parentCommentId(comment.getParentCommentId())
                .username(profile != null ? profile.getUsername() : null)
                .firstName(profile != null ? profile.getFirstName() : null)
                .lastName(profile != null ? profile.getLastName() : null)
                .avatar(profile != null ? profile.getAvatar() : null)
                .content(comment.getContent())
                .likeCount(likedUserIds.size())
                .likedByMe(viewerUserId != null && likedUserIds.contains(viewerUserId))
                .replies(replies)
                .created(dateTimeFormatter.format(comment.getCreatedDate()))
                .createdDate(comment.getCreatedDate())
                .build();
    }

    private PostComment findComment(List<PostComment> comments, String commentId) {
        if (comments == null || comments.isEmpty()) {
            return null;
        }

        for (PostComment comment : comments) {
            if (commentId.equals(comment.getId())) {
                return comment;
            }

            PostComment replyMatch = findComment(comment.getReplies(), commentId);
            if (replyMatch != null) {
                return replyMatch;
            }
        }

        return null;
    }

    private int countComments(List<PostComment> comments) {
        if (comments == null || comments.isEmpty()) {
            return 0;
        }

        int total = 0;
        for (PostComment comment : comments) {
            total += 1 + countComments(comment.getReplies());
        }
        return total;
    }

    private Post getPost(String postId) {
        return postRepository.findById(postId).orElseThrow(() -> new AppException(ErrorCode.POST_NOT_FOUND));
    }

    private UserProfileResponse getUserProfile(String userId, Map<String, UserProfileResponse> profiles) {
        return profiles.computeIfAbsent(userId, this::fetchUserProfile);
    }

    private UserProfileResponse fetchUserProfile(String userId) {
        try {
            return profileClient.getProfile(userId).getResult();
        } catch (Exception exception) {
            log.error("Error while getting user profile", exception);
            return null;
        }
    }

    private String getCurrentUserId() {
        String userId = getCurrentUserIdOrNull();
        if (userId == null) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        return userId;
    }

    private String getCurrentUserIdOrNull() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }

        String userId = authentication.getName();
        if (userId == null || "anonymousUser".equalsIgnoreCase(userId)) {
            return null;
        }

        return userId;
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }

        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private void publishPostNotification(Post post, PostResponse postResponse) {
        try {
            UserProfileResponse authorProfile = fetchUserProfile(post.getUserId());
            List<String> recipientUserIds = profileClient.getAllProfiles().getResult().stream()
                    .map(UserProfileResponse::getUserId)
                    .filter(Objects::nonNull)
                    .filter(recipientUserId -> !recipientUserId.equals(post.getUserId()))
                    .distinct()
                    .toList();

            if (recipientUserIds.isEmpty()) {
                return;
            }

            PostPublishedEvent event = PostPublishedEvent.builder()
                    .postId(post.getId())
                    .authorUserId(post.getUserId())
                    .authorUsername(authorProfile != null ? authorProfile.getUsername() : postResponse.getUsername())
                    .authorFirstName(authorProfile != null ? authorProfile.getFirstName() : null)
                    .authorLastName(authorProfile != null ? authorProfile.getLastName() : null)
                    .authorAvatar(authorProfile != null ? authorProfile.getAvatar() : null)
                    .contentPreview(buildContentPreview(post.getContent()))
                    .createdDate(post.getCreatedDate())
                    .recipientUserIds(recipientUserIds)
                    .build();

            kafkaTemplate.send("in-app-notification", event);
            notificationClient.createPostPublishedNotifications(event);
        } catch (Exception exception) {
            log.error("Unable to publish post notification event", exception);
        }
    }

    private String buildContentPreview(String content) {
        String normalized = trimToNull(content);
        if (normalized == null) {
            return "shared a new post.";
        }

        if (normalized.length() <= 120) {
            return normalized;
        }

        return normalized.substring(0, 117) + "...";
    }
}
