package com.techstore.mapper;

import com.techstore.dto.request.DiscountRequest;
import com.techstore.dto.response.DiscountResponse;
import com.techstore.entity.Discount;
import org.mapstruct.Mapper;

import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface DiscountMapper {

    @Mapping(target = "discountId", ignore = true)
    Discount toDiscount(DiscountRequest discountRequest);

    DiscountResponse toDiscountResponse(Discount discount);
}
