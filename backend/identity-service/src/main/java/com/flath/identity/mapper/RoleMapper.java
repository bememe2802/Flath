package com.flath.identity.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.flath.identity.dto.request.RoleRequest;
import com.flath.identity.dto.response.RoleResponse;
import com.flath.identity.entity.Role;

@Mapper(componentModel = "spring")
public interface RoleMapper {
    @Mapping(target = "permissions", ignore = true)
    Role toRole(RoleRequest request);

    RoleResponse toRoleResponse(Role role);
}
