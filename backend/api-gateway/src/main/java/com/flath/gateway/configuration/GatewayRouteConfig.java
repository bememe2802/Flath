package com.flath.gateway.configuration;

import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GatewayRouteConfig {

    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()
                // Identity Service
                .route("identity_service", r -> r
                        .path("/api/v1/identity/**", "/identity/**")
                        .filters(f -> f.stripPrefix(0))
                        .uri("http://identity-service:8080"))
                // Profile Service
                .route("profile_service", r -> r
                        .path("/api/v1/profile/users/**", "/profile/users/**")
                        .filters(f -> f.stripPrefix(0))
                        .uri("http://profile-service:8081"))
                // Notification Service
                .route("notification_service", r -> r
                        .path("/api/v1/notification/**", "/notification/**")
                        .filters(f -> f.stripPrefix(0))
                        .uri("http://notification-service:8082"))
                // Post Service
                .route("post_service", r -> r
                        .path("/api/v1/post/**", "/post/**")
                        .filters(f -> f.stripPrefix(0))
                        .uri("http://post-service:8083"))
                // File Service
                .route("file_service", r -> r
                        .path("/api/v1/file/**", "/file/**")
                        .filters(f -> f.stripPrefix(0))
                        .uri("http://file-service:8084"))
                // Chat WebSocket Service
                .route("chat_websocket_service", r -> r
                        .path("/api/v1/chat/ws", "/api/v1/chat/ws/**", "/chat/ws", "/chat/ws/**")
                        .filters(f -> f.stripPrefix(0))
                        .uri("ws://chat-service:8085"))
                // Chat Service
                .route("chat_service", r -> r
                        .path("/api/v1/chat/**", "/chat/**")
                        .filters(f -> f.stripPrefix(0))
                        .uri("http://chat-service:8085"))
                // Study Service
                .route("study_service", r -> r
                        .path("/api/v1/study/**", "/study/**")
                        .filters(f -> f.stripPrefix(0))
                        .uri("http://study-service:8086"))
                // Newsfeed Service
                .route("newsfeed_service", r -> r
                        .path("/api/v1/newsfeed/**", "/newsfeed/**")
                        .filters(f -> f.stripPrefix(0))
                        .uri("http://newsfeed-service:8087"))
                .build();
    }
}