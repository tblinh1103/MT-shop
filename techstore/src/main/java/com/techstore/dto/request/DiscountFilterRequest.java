package com.techstore.dto.request;

import lombok.Data;

import java.time.LocalDate;

@Data
public class DiscountFilterRequest {
    private String keyword; // mã hoặc mô tả

    private LocalDate startDateFrom;
    private LocalDate startDateTo;

    private Boolean systemStatus; // isActive

    private String effectiveStatus; // ACTIVE, EXPIRED,...

    private String availabilityStatus; // AVAILABLE, NEAR_EMPTY,...

    private Integer minPercent;
    private Integer maxPercent;
}