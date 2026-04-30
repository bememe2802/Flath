package com.flath.post.repository.httpclient;

import com.flath.post.dto.ApiResponse;
import com.flath.post.dto.response.UserProfileResponse;
import java.util.List;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "profile-service", url = "${app.services.profile.url}")
public interface ProfileClient {
    @GetMapping("/internal/users/{userId}")
    ApiResponse<UserProfileResponse> getProfile(@PathVariable String userId);

    @GetMapping("/internal/users")
    ApiResponse<List<UserProfileResponse>> getAllProfiles();
}
