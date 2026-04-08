package com.techstore.mapper;

import com.techstore.dto.request.RoleRequest;
import com.techstore.dto.response.RoleResponse;
import com.techstore.entity.Role;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface RoleMapper {
    @Mapping(target = "roleId", ignore = true)
    @Mapping(target = "users", ignore = true)
    Role toRole(RoleRequest roleRequest);

    RoleResponse toRoleResponse(Role role);

    @Mapping(target = "roleId", ignore = true)
    @Mapping(target = "users", ignore = true)
    void updateRole(@MappingTarget Role role, RoleRequest roleRequest);
}
