package com.techstore.dto.request;

import lombok.Data;

import java.util.List;

@Data
public class ProductRequest {
    private Integer categoryId;
    private Integer brandId;
    private String productName;
    private Integer warrantyMonths;
    private String productStatus;
    private List<ProductVariantRequest> productVariants;
    private List<ImageRequest> images;
}
