package com.flath.profile.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

import com.flath.profile.dto.request.ProfileCreationRequest;
import com.flath.profile.dto.request.UpdateProfileRequest;
import com.flath.profile.dto.response.UserProfileResponse;
import com.flath.profile.entity.UserProfile;

@Mapper(componentModel = "spring")
public interface UserProfileMapper {
    UserProfile toUserProfile(ProfileCreationRequest request);

    UserProfileResponse toUserProfileResponse(UserProfile entity);

    void update(@MappingTarget UserProfile entity, UpdateProfileRequest request);
}
