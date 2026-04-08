package com.techstore.mapper;

import com.techstore.dto.request.BrandRequest;
import com.techstore.dto.response.BrandResponse;
import com.techstore.entity.Brand;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface BrandMapper {
    @Mapping(target = "brandId", ignore = true)
    @Mapping(target = "products", ignore = true)
    Brand toBrand(BrandRequest brandRequest);

    BrandResponse toBrandResponse(Brand brand);
}
