package com.techstore.mapper;

import com.techstore.dto.response.CartResponse;
import com.techstore.entity.Cart;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface CartMapper {

    @Mapping(target = "cartItems", ignore = true)
    @Mapping(target = "total", ignore = true)
    CartResponse toCartResponse(Cart cart);
}
