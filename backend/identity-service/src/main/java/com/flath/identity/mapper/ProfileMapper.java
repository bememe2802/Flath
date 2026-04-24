package com.flath.identity.mapper;

import org.mapstruct.Mapper;

import com.flath.identity.dto.request.ProfileCreationRequest;
import com.flath.identity.dto.request.UserCreationRequest;

@Mapper(componentModel = "spring")
public interface ProfileMapper {
    ProfileCreationRequest toProfileCreationRequest(UserCreationRequest request);
}
