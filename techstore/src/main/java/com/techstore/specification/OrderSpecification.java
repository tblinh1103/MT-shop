package com.techstore.specification;

import com.techstore.entity.Order;
import com.techstore.entity.Payment;
import jakarta.persistence.criteria.*;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;

public class OrderSpecification {

    public static Specification<Order> filter(
            String orderCode,
            String recipientName,
            String recipientPhone,
            String orderStatus,
            String paymentStatus,
            String paymentMethod,
            LocalDateTime fromDate,
            LocalDateTime toDate) {
        return (Root<Order> root, CriteriaQuery<?> query, CriteriaBuilder cb) -> {

            // JOIN payment
            Join<Order, Payment> paymentJoin = root.join("payment", JoinType.LEFT);

            // 🔹 predicate gốc (AND)
            Predicate predicate = cb.conjunction();

            Predicate searchPredicate = cb.disjunction(); // OR

            if (orderCode != null && !orderCode.isEmpty()) {
                searchPredicate = cb.or(searchPredicate,
                        cb.like(root.get("orderCode"), "%" + orderCode + "%"));
            }

            if (recipientName != null && !recipientName.isEmpty()) {
                searchPredicate = cb.or(searchPredicate,
                        cb.like(root.get("recipientName"), "%" + recipientName + "%"));
            }

            if (recipientPhone != null && !recipientPhone.isEmpty()) {
                searchPredicate = cb.or(searchPredicate,
                        cb.like(root.get("recipientPhone"), "%" + recipientPhone + "%"));
            }

            // gộp search vào predicate chính
            if (searchPredicate.getExpressions().size() > 0) {
                predicate = cb.and(predicate, searchPredicate);
            }

            // 🎯 FILTER
            if (orderStatus != null && !orderStatus.isEmpty()) {
                predicate = cb.and(predicate,
                        cb.equal(root.get("orderStatus"), orderStatus));
            }

            if (paymentStatus != null) {
                predicate = cb.and(predicate,
                        cb.equal(paymentJoin.get("paymentStatus"), paymentStatus));
            }

            if (paymentMethod != null) {
                predicate = cb.and(predicate,
                        cb.equal(paymentJoin.get("paymentMethod"), paymentMethod));
            }

            // 📅 DATE
            if (fromDate != null) {
                predicate = cb.and(predicate,
                        cb.greaterThanOrEqualTo(root.get("createdAt"), fromDate));
            }

            if (toDate != null) {
                predicate = cb.and(predicate,
                        cb.lessThanOrEqualTo(root.get("createdAt"), toDate));
            }

            return predicate;
        };
    }
}