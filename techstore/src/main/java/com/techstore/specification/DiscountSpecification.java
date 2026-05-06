package com.techstore.specification;

import com.techstore.entity.Discount;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;

public class DiscountSpecification {

    public static Specification<Discount> filter(
            String keyword,
            Boolean systemStatus,
            LocalDate startDateFrom,
            LocalDate startDateTo,
            Integer minPercent,
            Integer maxPercent,
            String availabilityStatus) {

        return (root, query, cb) -> {

            Predicate predicate = cb.conjunction();

            // keyword (code / description)
            if (keyword != null && !keyword.isBlank()) {
                String like = "%" + keyword.toLowerCase() + "%";
                predicate = cb.and(predicate,
                        cb.or(
                                cb.like(cb.lower(root.get("code")), like),
                                cb.like(cb.lower(root.get("description")), like)));
            }

            // system status (isActive)
            if (systemStatus != null) {
                predicate = cb.and(predicate,
                        cb.equal(root.get("isActive"), systemStatus));
            }

            // date from
            if (startDateFrom != null) {
                predicate = cb.and(predicate,
                        cb.greaterThanOrEqualTo(root.get("startDate"), startDateFrom));
            }

            // date to
            if (startDateTo != null) {
                predicate = cb.and(predicate,
                        cb.lessThanOrEqualTo(root.get("endDate"), startDateTo));
            }

            // percent range
            if (minPercent != null) {
                predicate = cb.and(predicate,
                        cb.greaterThanOrEqualTo(root.get("discountPercent"), minPercent));
            }

            if (maxPercent != null) {
                predicate = cb.and(predicate,
                        cb.lessThanOrEqualTo(root.get("discountPercent"), maxPercent));
            }

            // availability status
            if (availabilityStatus != null) {
                switch (availabilityStatus) {
                    case "AVAILABLE":
                        predicate = cb.and(predicate,
                                cb.greaterThan(root.get("remainingQuantity"), 0));
                        break;
                    case "NEAR_EMPTY":
                        predicate = cb.and(predicate,
                                cb.and(
                                        cb.greaterThan(root.get("remainingQuantity"), 0),
                                        cb.lessThanOrEqualTo(root.get("remainingQuantity"), 20),
                                        cb.notEqual(root.get("remainingQuantity"), 0)));
                        break;
                    case "EMPTY":
                        predicate = cb.and(predicate,
                                cb.equal(root.get("remainingQuantity"), 0));
                        break;
                }
            }

            return predicate;
        };
    }
}