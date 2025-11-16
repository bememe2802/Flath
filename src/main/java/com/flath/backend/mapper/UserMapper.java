package com.flath.backend.mapper;

import com.flath.backend.dto.request.UserCreationRequest;
import com.flath.backend.dto.request.UserUpdateRequest;
import com.flath.backend.dto.response.UserResponse;
import com.flath.backend.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface UserMapper {
    User toUser(UserCreationRequest request);
    void updateUser(@MappingTarget User user, UserUpdateRequest request);
    UserResponse toUserMapper(User user);
}
