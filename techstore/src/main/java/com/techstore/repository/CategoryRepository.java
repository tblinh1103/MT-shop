package com.techstore.repository;

import com.techstore.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, String> {
    boolean existsByCategoryName(String categoryName);

    Optional<Category> findByCategoryNameIgnoreCase(String name);
}
