package com.flath.newsfeed.repository.httpclient;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.flath.newsfeed.dto.ApiResponse;
import com.flath.newsfeed.dto.PageResponse;
import com.flath.newsfeed.dto.response.PostResponse;

@FeignClient(name = "post-service", url = "${app.services.post.url}")
public interface PostClient {
    @GetMapping("/internal/posts/feed")
    ApiResponse<PageResponse<PostResponse>> getFeed(@RequestParam("page") int page, @RequestParam("size") int size);
}
