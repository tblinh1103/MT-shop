package com.techstore.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.techstore.enums.DiscountStatus;

@Data
public class DiscountResponse {
    private String discountId;
    private String code;
    private String description;
    private Integer discountPercent;
    private BigDecimal minOrderAmount;
    private BigDecimal maxDiscountAmount;
    private Integer totalQuantity;
    private Integer remainingQuantity;
    private LocalDate startDate;
    private LocalDate endDate;
    private Boolean isActive;
    private DiscountStatus status;
}
