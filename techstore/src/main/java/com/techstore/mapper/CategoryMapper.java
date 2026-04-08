package com.techstore.mapper;

import com.techstore.dto.request.CategoryRequest;

import com.techstore.dto.response.CategoryResponse;

import com.techstore.entity.Category;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface CategoryMapper {
    @Mapping(target = "categoryId", ignore = true)
    @Mapping(target = "products", ignore = true)
    Category toCategory(CategoryRequest categoryRequest);

    CategoryResponse toCategoryResponse(Category category);
}
