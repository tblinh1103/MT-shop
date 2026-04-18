package com.techstore.repository;

import com.techstore.entity.ProductSpec;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

public interface ProductSpecRepository extends JpaRepository<ProductSpec, String> {

    @Modifying
    @Transactional
    @Query("DELETE FROM ProductSpec ps WHERE ps.productVariant.productVariantId = :id")
    int deleteByVariantId(String id);
}