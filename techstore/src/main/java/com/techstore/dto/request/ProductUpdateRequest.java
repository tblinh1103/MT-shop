package com.techstore.dto.request;

import com.techstore.enums.ProductStatus;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.util.List;

@Data
public class ProductUpdateRequest {

    @NotBlank(message = "Product name không được để trống")
    private String productName;

    @NotBlank
    private String brandId;

    @Min(0)
    private Integer warrantyMonths;

    private ProductStatus status;

    private List<ImageRequest> images;
}
