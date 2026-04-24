package com.flath.chat.websocket;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.flath.chat.dto.request.ChatMessageRequest;
import com.flath.chat.dto.request.RealtimeChatMessageRequest;
import com.flath.chat.exception.AppException;
import com.flath.chat.exception.ErrorCode;
import com.flath.chat.service.ChatMessageService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ChatWebSocketHandler extends TextWebSocketHandler {
    ObjectMapper objectMapper;
    ChatMessageService chatMessageService;
    ChatSocketSessionRegistry chatSocketSessionRegistry;

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        chatSocketSessionRegistry.register(session);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        try {
            RealtimeChatMessageRequest payload =
                    objectMapper.readValue(message.getPayload(), RealtimeChatMessageRequest.class);
            String conversationId =
                    (String) session.getAttributes().get(ChatHandshakeInterceptor.CONVERSATION_ID_ATTRIBUTE);
            String userId = (String) session.getAttributes().get(ChatHandshakeInterceptor.USER_ID_ATTRIBUTE);

            if (conversationId == null || userId == null) {
                throw new AppException(ErrorCode.UNAUTHENTICATED);
            }

            chatMessageService.create(
                    ChatMessageRequest.builder()
                            .conversationId(conversationId)
                            .message(payload.getMessage())
                            .build(),
                    userId);
        } catch (AppException exception) {
            chatSocketSessionRegistry.sendError(
                    session, exception.getErrorCode().getMessage());
        } catch (Exception exception) {
            chatSocketSessionRegistry.sendError(session, ErrorCode.UNCATEGORIZED_EXCEPTION.getMessage());
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        chatSocketSessionRegistry.unregister(session);
    }
}
