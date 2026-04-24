package com.flath.chat.service;

import java.time.Instant;
import java.util.List;
import java.util.Objects;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.flath.chat.dto.request.ChatMessageRequest;
import com.flath.chat.dto.response.ChatMessageResponse;
import com.flath.chat.entity.ChatMessage;
import com.flath.chat.entity.ParticipantInfo;
import com.flath.chat.exception.AppException;
import com.flath.chat.exception.ErrorCode;
import com.flath.chat.mapper.ChatMessageMapper;
import com.flath.chat.repository.ChatMessageRepository;
import com.flath.chat.repository.ConversationRepository;
import com.flath.chat.repository.httpclient.ProfileClient;
import com.flath.chat.websocket.ChatSocketSessionRegistry;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ChatMessageService {
    ChatMessageRepository chatMessageRepository;
    ConversationRepository conversationRepository;
    ProfileClient profileClient;
    ChatSocketSessionRegistry chatSocketSessionRegistry;

    ChatMessageMapper chatMessageMapper;

    public List<ChatMessageResponse> getMessages(String conversationId) {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        validateConversationMembership(conversationId, userId);

        var messages = chatMessageRepository.findAllByConversationIdOrderByCreatedDateDesc(conversationId);

        return messages.stream().map(this::toChatMessageResponse).toList();
    }

    public ChatMessageResponse create(ChatMessageRequest request) {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        return create(request, userId);
    }

    public ChatMessageResponse create(ChatMessageRequest request, String userId) {
        validateConversationMembership(request.getConversationId(), userId);

        String normalizedMessage =
                request.getMessage() != null ? request.getMessage().trim() : null;
        if (normalizedMessage == null || normalizedMessage.isBlank()) {
            throw new AppException(ErrorCode.MESSAGE_INVALID);
        }

        var userResponse = profileClient.getProfile(userId);
        if (Objects.isNull(userResponse)) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
        var userInfo = userResponse.getResult();

        ChatMessage chatMessage = chatMessageMapper.toChatMessage(request);
        chatMessage.setMessage(normalizedMessage);
        chatMessage.setSender(ParticipantInfo.builder()
                .userId(userInfo.getUserId())
                .username(userInfo.getUsername())
                .firstName(userInfo.getFirstName())
                .lastName(userInfo.getLastName())
                .avatar(userInfo.getAvatar())
                .build());
        chatMessage.setCreatedDate(Instant.now());

        chatMessage = chatMessageRepository.save(chatMessage);

        ChatMessageResponse chatMessageResponse = toChatMessageResponse(chatMessage, userId);
        chatSocketSessionRegistry.broadcastMessage(chatMessage.getConversationId(), chatMessageResponse);

        return chatMessageResponse;
    }

    private void validateConversationMembership(String conversationId, String userId) {
        conversationRepository
                .findById(conversationId)
                .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND))
                .getParticipants()
                .stream()
                .filter(participantInfo -> userId.equals(participantInfo.getUserId()))
                .findAny()
                .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));
    }

    private ChatMessageResponse toChatMessageResponse(ChatMessage chatMessage) {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        return toChatMessageResponse(chatMessage, userId);
    }

    private ChatMessageResponse toChatMessageResponse(ChatMessage chatMessage, String userId) {
        var chatMessageResponse = chatMessageMapper.toChatMessageResponse(chatMessage);

        chatMessageResponse.setMe(userId.equals(chatMessage.getSender().getUserId()));

        return chatMessageResponse;
    }
}
