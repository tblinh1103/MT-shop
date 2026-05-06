package com.techstore.repository;

import com.techstore.entity.Brand;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface BrandRepository extends JpaRepository<Brand, String> {
    boolean existsByBrandName(String brandName);

    Optional<Brand> findByBrandNameIgnoreCase(String brandName);
}
