package com.flath.chat.mapper;

import java.util.List;

import org.mapstruct.Mapper;

import com.flath.chat.dto.request.ChatMessageRequest;
import com.flath.chat.dto.response.ChatMessageResponse;
import com.flath.chat.entity.ChatMessage;

@Mapper(componentModel = "spring")
public interface ChatMessageMapper {
    ChatMessageResponse toChatMessageResponse(ChatMessage chatMessage);

    ChatMessage toChatMessage(ChatMessageRequest request);

    List<ChatMessageResponse> toChatMessageResponses(List<ChatMessage> chatMessages);
}
