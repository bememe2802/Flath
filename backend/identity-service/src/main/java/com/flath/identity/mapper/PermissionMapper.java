package com.flath.identity.mapper;

import org.mapstruct.Mapper;

import com.flath.identity.dto.request.PermissionRequest;
import com.flath.identity.dto.response.PermissionResponse;
import com.flath.identity.entity.Permission;

@Mapper(componentModel = "spring")
public interface PermissionMapper {
    Permission toPermission(PermissionRequest request);

    PermissionResponse toPermissionResponse(Permission permission);
}
