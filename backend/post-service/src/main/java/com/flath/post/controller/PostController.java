package com.flath.post.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.flath.post.dto.ApiResponse;
import com.flath.post.dto.PageResponse;
import com.flath.post.dto.request.CommentRequest;
import com.flath.post.dto.request.PostRequest;
import com.flath.post.dto.request.SharePostRequest;
import com.flath.post.dto.response.PostCommentResponse;
import com.flath.post.dto.response.PostReactionResponse;
import com.flath.post.dto.response.PostResponse;
import com.flath.post.service.PostService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PostController {
    PostService postService;

    @PostMapping("/create")
    ApiResponse<PostResponse> createPost(@RequestBody PostRequest request) {
        return ApiResponse.<PostResponse>builder()
                .result(postService.createPost(request))
                .build();
    }

    @GetMapping("/my-posts")
    ApiResponse<PageResponse<PostResponse>> myPosts(
            @RequestParam(value = "page", required = false, defaultValue = "1") int page,
            @RequestParam(value = "size", required = false, defaultValue = "10") int size) {
        return ApiResponse.<PageResponse<PostResponse>>builder()
                .result(postService.getMyPosts(page, size))
                .build();
    }

    @PostMapping("/{postId}/likes/toggle")
    ApiResponse<PostReactionResponse> toggleLike(@PathVariable String postId) {
        return ApiResponse.<PostReactionResponse>builder()
                .result(postService.toggleLike(postId))
                .build();
    }

    @GetMapping("/{postId}/comments")
    ApiResponse<List<PostCommentResponse>> getComments(@PathVariable String postId) {
        return ApiResponse.<List<PostCommentResponse>>builder()
                .result(postService.getComments(postId))
                .build();
    }

    @PostMapping("/{postId}/comments")
    ApiResponse<PostCommentResponse> addComment(@PathVariable String postId, @RequestBody CommentRequest request) {
        return ApiResponse.<PostCommentResponse>builder()
                .result(postService.addComment(postId, request))
                .build();
    }

    @PostMapping("/{postId}/comments/{commentId}/likes/toggle")
    ApiResponse<PostReactionResponse> toggleCommentLike(@PathVariable String postId, @PathVariable String commentId) {
        return ApiResponse.<PostReactionResponse>builder()
                .result(postService.toggleCommentLike(postId, commentId))
                .build();
    }

    @PostMapping("/{postId}/comments/{commentId}/replies")
    ApiResponse<PostCommentResponse> replyToComment(
            @PathVariable String postId, @PathVariable String commentId, @RequestBody CommentRequest request) {
        return ApiResponse.<PostCommentResponse>builder()
                .result(postService.replyToComment(postId, commentId, request))
                .build();
    }

    @PostMapping("/{postId}/share")
    ApiResponse<PostResponse> sharePost(@PathVariable String postId, @RequestBody(required = false) SharePostRequest request) {
        return ApiResponse.<PostResponse>builder()
                .result(postService.sharePost(
                        postId,
                        request != null ? request : SharePostRequest.builder().build()))
                .build();
    }
}
