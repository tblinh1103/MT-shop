package com.techstore.repository;

import com.techstore.entity.Discount;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

public interface DiscountRepository
    extends JpaRepository<Discount, String>,
    JpaSpecificationExecutor<Discount> {

  List<Discount> findAllByOrderByEndDateDesc();

  boolean existsByCode(String code);

  Optional<Discount> findByCode(String code);

  Optional<Discount> findByCodeAndIsActiveTrueAndRemainingQuantityGreaterThan(String code, Integer value);

  @Modifying
  @Query("""
          UPDATE Discount d
          SET d.remainingQuantity = d.remainingQuantity - 1
          WHERE d.discountId = :id
            AND d.remainingQuantity > 0
      """)
  int decreaseRemainingQuantity(@Param("id") String id);
}
