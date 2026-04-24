package com.flath.chat.websocket;

import java.time.Instant;
import java.util.Map;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.http.HttpStatus;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import com.flath.chat.configuration.CustomJwtDecoder;
import com.flath.chat.repository.ConversationRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ChatHandshakeInterceptor implements HandshakeInterceptor {
    public static final String CONVERSATION_ID_ATTRIBUTE = "conversationId";
    public static final String USER_ID_ATTRIBUTE = "userId";

    CustomJwtDecoder customJwtDecoder;
    ConversationRepository conversationRepository;

    @Override
    public boolean beforeHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Map<String, Object> attributes) {
        if (!(request instanceof ServletServerHttpRequest servletServerHttpRequest)) {
            response.setStatusCode(HttpStatus.BAD_REQUEST);
            return false;
        }

        HttpServletRequest httpServletRequest = servletServerHttpRequest.getServletRequest();
        String token = httpServletRequest.getParameter("token");
        String conversationId = httpServletRequest.getParameter("conversationId");

        if (token == null || token.isBlank() || conversationId == null || conversationId.isBlank()) {
            response.setStatusCode(HttpStatus.UNAUTHORIZED);
            return false;
        }

        try {
            Jwt jwt = customJwtDecoder.decode(token);
            if (jwt.getExpiresAt() != null && jwt.getExpiresAt().isBefore(Instant.now())) {
                response.setStatusCode(HttpStatus.UNAUTHORIZED);
                return false;
            }

            String userId = jwt.getSubject();
            boolean isParticipant = conversationRepository
                    .findById(conversationId)
                    .map(conversation -> conversation.getParticipants().stream()
                            .anyMatch(participantInfo -> userId.equals(participantInfo.getUserId())))
                    .orElse(false);

            if (!isParticipant) {
                response.setStatusCode(HttpStatus.FORBIDDEN);
                return false;
            }

            attributes.put(CONVERSATION_ID_ATTRIBUTE, conversationId);
            attributes.put(USER_ID_ATTRIBUTE, userId);
            return true;
        } catch (JwtException exception) {
            response.setStatusCode(HttpStatus.UNAUTHORIZED);
            return false;
        }
    }

    @Override
    public void afterHandshake(
            ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler wsHandler, Exception exception) {}
}
