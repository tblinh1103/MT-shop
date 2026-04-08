package com.techstore.dto.request;

import lombok.Data;

import java.util.Set;

@Data
public class CartRequest {
    private Integer userId;
    private Set<CartItemRequest> items;
}
