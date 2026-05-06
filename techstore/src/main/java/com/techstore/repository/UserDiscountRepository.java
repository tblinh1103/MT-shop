package com.techstore.repository;

import com.techstore.entity.UserDiscount;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserDiscountRepository extends JpaRepository<UserDiscount, String> {

    boolean existsByUserIdAndDiscountId(String userId, String discountId);
}