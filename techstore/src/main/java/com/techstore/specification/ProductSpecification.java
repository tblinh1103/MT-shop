package com.techstore.specification;

import com.techstore.entity.Product;
import com.techstore.entity.ProductVariant;

import jakarta.persistence.criteria.*;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class ProductSpecification {

    public static Specification<Product> filter(
            String categoryId,
            String brandId,
            String status,
            String keyword,
            Double minPrice,
            Double maxPrice,
            Boolean inStock) {
        return (root, query, cb) -> {

            List<Predicate> predicates = new ArrayList<>();

            // CATEGORY
            if (categoryId != null && !categoryId.isEmpty()) {
                predicates.add(cb.equal(root.get("category").get("categoryId"), categoryId));
            }

            // BRAND
            if (brandId != null && !brandId.isEmpty()) {
                predicates.add(cb.equal(root.get("brand").get("brandId"), brandId));
            }

            // STATUS
            if (status != null && !status.isEmpty()) {
                predicates.add(cb.equal(root.get("productStatus"), status));
            }

            // KEYWORD
            if (keyword != null && !keyword.isEmpty()) {
                predicates.add(cb.like(
                        cb.lower(root.get("productName")),
                        "%" + keyword.toLowerCase() + "%"));
            }

            // 🔥 JOIN VARIANT (price + stock)
            if (minPrice != null || maxPrice != null || Boolean.TRUE.equals(inStock)) {

                Join<Product, ProductVariant> variantJoin = root.join("productVariants");

                if (minPrice != null) {
                    predicates.add(cb.greaterThanOrEqualTo(
                            variantJoin.get("promotionalPrice"),
                            BigDecimal.valueOf(minPrice)));
                }

                if (maxPrice != null) {
                    predicates.add(cb.lessThanOrEqualTo(
                            variantJoin.get("promotionalPrice"),
                            BigDecimal.valueOf(maxPrice)));
                }

                if (Boolean.TRUE.equals(inStock)) {
                    predicates.add(cb.greaterThan(variantJoin.get("stock"), 0));
                }

                query.distinct(true); // tránh trùng product
            }

            // 🎯 LOẠI BỎ DELETED (soft delete)
            predicates.add(cb.notEqual(root.get("productStatus"), "DELETED"));

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}