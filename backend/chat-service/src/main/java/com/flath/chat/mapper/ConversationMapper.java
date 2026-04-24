package com.flath.chat.mapper;

import java.util.List;

import org.mapstruct.Mapper;

import com.flath.chat.dto.response.ConversationResponse;
import com.flath.chat.entity.Conversation;

@Mapper(componentModel = "spring")
public interface ConversationMapper {
    ConversationResponse toConversationResponse(Conversation conversation);

    List<ConversationResponse> toConversationResponseList(List<Conversation> conversations);
}
