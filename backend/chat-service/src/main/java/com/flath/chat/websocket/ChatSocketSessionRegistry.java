package com.flath.chat.websocket;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.flath.chat.dto.response.ChatMessageResponse;
import com.flath.chat.dto.response.ChatSocketEvent;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ChatSocketSessionRegistry {
    ObjectMapper objectMapper;
    Map<String, Set<WebSocketSession>> sessionsByConversation = new ConcurrentHashMap<>();

    public void register(WebSocketSession session) {
        String conversationId =
                (String) session.getAttributes().get(ChatHandshakeInterceptor.CONVERSATION_ID_ATTRIBUTE);
        if (conversationId == null || conversationId.isBlank()) {
            return;
        }

        sessionsByConversation
                .computeIfAbsent(conversationId, ignored -> ConcurrentHashMap.newKeySet())
                .add(session);
    }

    public void unregister(WebSocketSession session) {
        String conversationId =
                (String) session.getAttributes().get(ChatHandshakeInterceptor.CONVERSATION_ID_ATTRIBUTE);
        if (conversationId == null || conversationId.isBlank()) {
            return;
        }

        Set<WebSocketSession> sessions = sessionsByConversation.get(conversationId);
        if (sessions == null) {
            return;
        }

        sessions.remove(session);
        if (sessions.isEmpty()) {
            sessionsByConversation.remove(conversationId);
        }
    }

    public void broadcastMessage(String conversationId, ChatMessageResponse chatMessageResponse) {
        Set<WebSocketSession> sessions = sessionsByConversation.getOrDefault(conversationId, Set.of());

        for (WebSocketSession session : sessions) {
            if (!session.isOpen()) {
                unregister(session);
                continue;
            }

            String userId = (String) session.getAttributes().get(ChatHandshakeInterceptor.USER_ID_ATTRIBUTE);
            ChatMessageResponse personalizedMessage = ChatMessageResponse.builder()
                    .id(chatMessageResponse.getId())
                    .conversationId(chatMessageResponse.getConversationId())
                    .me(chatMessageResponse.getSender() != null
                            && chatMessageResponse.getSender().getUserId().equals(userId))
                    .message(chatMessageResponse.getMessage())
                    .sender(chatMessageResponse.getSender())
                    .createdDate(chatMessageResponse.getCreatedDate())
                    .build();

            sendEvent(
                    session,
                    ChatSocketEvent.builder()
                            .type("MESSAGE")
                            .message(personalizedMessage)
                            .build());
        }
    }

    public void sendError(WebSocketSession session, String error) {
        sendEvent(session, ChatSocketEvent.builder().type("ERROR").error(error).build());
    }

    private void sendEvent(WebSocketSession session, ChatSocketEvent event) {
        try {
            session.sendMessage(new TextMessage(objectMapper.writeValueAsString(event)));
        } catch (IOException exception) {
            unregister(session);
        }
    }
}
