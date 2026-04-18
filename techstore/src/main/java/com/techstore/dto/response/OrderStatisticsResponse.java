package com.techstore.dto.response;

public interface OrderStatisticsResponse {
    Long getPending();

    Long getConfirmed();

    Long getShipping();

    Long getCompleted();

    Long getCancelled();
}
