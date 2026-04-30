package com.flath.profile.service;

import java.time.Duration;
import java.util.Optional;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.flath.profile.dto.response.UserProfileResponse;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ProfileCacheService {
    StringRedisTemplate redisTemplate;
    ObjectMapper objectMapper;

    Duration ttl = Duration.ofMinutes(30);

    public Optional<UserProfileResponse> getByUserId(String userId) {
        String cachedValue = redisTemplate.opsForValue().get(buildKey(userId));
        if (cachedValue == null || cachedValue.isBlank()) {
            return Optional.empty();
        }

        try {
            return Optional.of(objectMapper.readValue(cachedValue, UserProfileResponse.class));
        } catch (JsonProcessingException exception) {
            redisTemplate.delete(buildKey(userId));
            return Optional.empty();
        }
    }

    public void put(UserProfileResponse profile) {
        if (profile == null
                || profile.getUserId() == null
                || profile.getUserId().isBlank()) {
            return;
        }

        try {
            redisTemplate
                    .opsForValue()
                    .set(buildKey(profile.getUserId()), objectMapper.writeValueAsString(profile), ttl);
        } catch (JsonProcessingException exception) {
            redisTemplate.delete(buildKey(profile.getUserId()));
        }
    }

    public void evict(String userId) {
        if (userId == null || userId.isBlank()) {
            return;
        }

        redisTemplate.delete(buildKey(userId));
    }

    private String buildKey(String userId) {
        return "profile:user:" + userId;
    }
}
