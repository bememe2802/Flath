package com.flath.newsfeed.service;

import java.time.Duration;
import java.util.Optional;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.flath.newsfeed.dto.PageResponse;
import com.flath.newsfeed.dto.response.NewsfeedItemResponse;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class NewsfeedCacheService {
    StringRedisTemplate redisTemplate;
    ObjectMapper objectMapper;

    Duration ttl = Duration.ofSeconds(45);

    public Optional<PageResponse<NewsfeedItemResponse>> getFeed(String viewerUserId, int page, int size) {
        String cachedValue = redisTemplate.opsForValue().get(buildKey(viewerUserId, page, size));
        if (cachedValue == null || cachedValue.isBlank()) {
            return Optional.empty();
        }

        try {
            return Optional.of(
                    objectMapper.readValue(cachedValue, new TypeReference<PageResponse<NewsfeedItemResponse>>() {}));
        } catch (JsonProcessingException exception) {
            redisTemplate.delete(buildKey(viewerUserId, page, size));
            return Optional.empty();
        }
    }

    public void putFeed(String viewerUserId, int page, int size, PageResponse<NewsfeedItemResponse> response) {
        try {
            redisTemplate
                    .opsForValue()
                    .set(buildKey(viewerUserId, page, size), objectMapper.writeValueAsString(response), ttl);
        } catch (JsonProcessingException exception) {
            redisTemplate.delete(buildKey(viewerUserId, page, size));
        }
    }

    private String buildKey(String viewerUserId, int page, int size) {
        return "newsfeed:home:" + viewerUserId + ":page:" + page + ":size:" + size;
    }
}
