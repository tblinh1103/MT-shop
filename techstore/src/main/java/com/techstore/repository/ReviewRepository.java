package com.techstore.repository;

import com.techstore.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, String> {
    List<Review> findAllByUser_UserIdOrderByCreatedAtDesc(String userId);
}
