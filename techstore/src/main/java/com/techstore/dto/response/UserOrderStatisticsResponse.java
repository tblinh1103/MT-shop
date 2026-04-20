package com.techstore.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserOrderStatisticsResponse {
    private long totalOrders;
    private long completedOrders;
    private long cancelledOrders;
    private double totalCompletedAmount;

    // % huỷ
    private double cancelRate;

    // đánh giá
    private String rating;
}
