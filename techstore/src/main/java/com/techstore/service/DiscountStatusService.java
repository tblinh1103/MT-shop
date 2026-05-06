package com.techstore.service;

import java.time.LocalDate;

import org.springframework.stereotype.Service;

import com.techstore.entity.Discount;
import com.techstore.enums.DiscountStatus;

@Service
public class DiscountStatusService {

    public DiscountStatus resolve(Discount discount) {
        LocalDate now = LocalDate.now();

        if (!discount.getIsActive()) {
            return DiscountStatus.INACTIVE;
        }

        if (discount.getRemainingQuantity() <= 0) {
            return DiscountStatus.USED_UP;
        }

        if (now.isBefore(discount.getStartDate())) {
            return DiscountStatus.UPCOMING;
        }

        if (now.isAfter(discount.getEndDate())) {
            return DiscountStatus.EXPIRED;
        }

        return DiscountStatus.ACTIVE;
    }

}
