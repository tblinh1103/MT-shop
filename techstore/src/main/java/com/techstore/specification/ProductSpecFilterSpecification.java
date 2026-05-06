package com.techstore.specification;

import com.techstore.entity.Product;
import com.techstore.entity.ProductVariant;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;

import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import org.springframework.data.jpa.domain.Specification;

public class ProductSpecFilterSpecification {

    public static Specification<Product> hasSpecs(Map<String, String> specs) {
        return (root, query, cb) -> {

            if (specs == null || specs.isEmpty()) {
                return cb.conjunction();
            }

            query.distinct(true);

            Join<Object, Object> variantJoin = root.join("productVariants", JoinType.LEFT);
            Join<Object, Object> specJoin = variantJoin.join("variantAttributes", JoinType.LEFT);
            Join<Object, Object> attrJoin = specJoin.join("attribute", JoinType.LEFT);
            Join<Object, Object> valueJoin = specJoin.join("attributeValue", JoinType.LEFT);

            List<Predicate> predicates = new ArrayList<>();

            specs.forEach((key, value) -> {
                predicates.add(cb.and(
                        cb.equal(cb.lower(attrJoin.get("name")), key.toLowerCase()),
                        cb.equal(cb.lower(valueJoin.get("value")), value.toLowerCase())));
            });

            // ⚠️ tạm thời OR (như đã nói)
            return cb.or(predicates.toArray(new Predicate[0]));
        };
    }
}
