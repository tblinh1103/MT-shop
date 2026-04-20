package com.techstore.repository;

import com.techstore.dto.response.OrderStatisticsResponse;
import com.techstore.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, String>, JpaSpecificationExecutor<Order> {

    List<Order> findAllByOrderByCreatedAtDesc();

    List<Order> findAllByOrderStatusOrderByCreatedAtDesc(String orderStatus);

    List<Order> findAllByUser_UserIdOrderByCreatedAtDesc(String userId);

    Page<Order> findAllByUser_UserId(String userId, Pageable pageable);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) " +
            "FROM Order o " +
            "WHERE o.orderStatus = 'COMPLETED' AND DATE(o.createdAt) = CURRENT_DATE")
    BigDecimal getTodayRevenue();

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) " +
            "FROM Order o " +
            "WHERE o.orderStatus = 'COMPLETED' " +
            "AND YEAR(o.createdAt) = YEAR(CURRENT_DATE) " +
            "AND MONTH(o.createdAt) = MONTH(CURRENT_DATE)")
    BigDecimal getMonthlyRevenue();

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) " +
            "FROM Order o " +
            "WHERE o.orderStatus = 'COMPLETED' " +
            "AND YEAR(o.createdAt) = YEAR(CURRENT_DATE)")
    BigDecimal getYearlyRevenue();

    // daily: returns rows (day, order_count) for current month
    @Query(value = "SELECT DAY(o.created_at) AS d, COUNT(*) AS cnt " +
            "FROM orders o " +
            "WHERE MONTH(o.created_at) = MONTH(CURRENT_DATE()) " +
            "  AND YEAR(o.created_at) = YEAR(CURRENT_DATE()) " +
            "GROUP BY DAY(o.created_at) " +
            "ORDER BY d", nativeQuery = true)
    List<Object[]> getDailyOrderCounts();

    // monthly: returns rows (month, order_count) for current year
    @Query(value = "SELECT MONTH(o.created_at) AS m, COUNT(*) AS cnt " +
            "FROM orders o " +
            "WHERE YEAR(o.created_at) = YEAR(CURRENT_DATE()) " +
            "GROUP BY MONTH(o.created_at) " +
            "ORDER BY m", nativeQuery = true)
    List<Object[]> getMonthlyOrderCounts();

    // yearly: returns rows (year, order_count) across years
    @Query(value = "SELECT YEAR(o.created_at) AS y, COUNT(*) AS cnt " +
            "FROM orders o " +
            "GROUP BY YEAR(o.created_at) " +
            "ORDER BY y", nativeQuery = true)
    List<Object[]> getYearlyOrderCounts();

    @Query("""
                SELECT
                    COUNT(o),
                    SUM(CASE WHEN o.orderStatus = 'COMPLETED' THEN 1 ELSE 0 END),
                    SUM(CASE WHEN o.orderStatus = 'CANCELLED' THEN 1 ELSE 0 END),
                    SUM(CASE WHEN o.orderStatus = 'COMPLETED' THEN o.totalAmount ELSE 0 END)
                FROM Order o
                WHERE o.user.userId = :userId
            """)
    List<Object[]> getOrderStatisticsByUserId(String userId);

    @Query(value = """
                SELECT
                  COUNT(CASE WHEN o.order_status = 'PENDING' THEN 1 END) AS pending,
                  COUNT(CASE WHEN o.order_status = 'CONFIRMED' THEN 1 END) AS confirmed,
                  COUNT(CASE WHEN o.order_status = 'SHIPPED' THEN 1 END) AS shipping,
                  COUNT(CASE WHEN o.order_status = 'COMPLETED' THEN 1 END) AS completed,
                  COUNT(CASE WHEN o.order_status = 'CANCELLED' THEN 1 END) AS cancelled
                FROM orders o
            """, nativeQuery = true)
    OrderStatisticsResponse getOrderStatistics();

}
