package com.flath.notification.service;

import java.util.Collection;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class NotificationUnreadCacheService {
    StringRedisTemplate redisTemplate;

    public void incrementUnread(Collection<String> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return;
        }

        var operations = redisTemplate.opsForValue();
        userIds.forEach(userId -> operations.increment(buildKey(userId)));
    }

    public long getUnreadCount(String userId) {
        String cachedValue = redisTemplate.opsForValue().get(buildKey(userId));
        if (cachedValue == null || cachedValue.isBlank()) {
            return -1L;
        }

        try {
            return Long.parseLong(cachedValue);
        } catch (NumberFormatException exception) {
            redisTemplate.delete(buildKey(userId));
            return -1L;
        }
    }

    public void setUnreadCount(String userId, long count) {
        redisTemplate.opsForValue().set(buildKey(userId), Long.toString(Math.max(0L, count)));
    }

    private String buildKey(String userId) {
        return "notification:unread:" + userId;
    }
}
