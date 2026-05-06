package com.techstore.controller;

import com.techstore.dto.request.OrderRequest;
import com.techstore.dto.response.ApiResponse;
import com.techstore.dto.response.OrderResponse;
import com.techstore.dto.response.OrderStatisticsResponse;
import com.techstore.dto.response.UserOrderStatisticsResponse;
import com.techstore.service.OrderService;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Page;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class OrderController {
        private final OrderService orderService;

        @PostMapping()
        public ApiResponse<OrderResponse> createOrder(@RequestBody OrderRequest request) {
                return ApiResponse.<OrderResponse>builder()
                                .message("Tạo đơn hàng thành công")
                                .result(orderService.createOrder(request))
                                .build();
        }

        @GetMapping("/{orderId}")
        public ApiResponse<OrderResponse> getOrderById(@PathVariable String orderId) {
                return ApiResponse.<OrderResponse>builder()
                                .result(orderService.getOrderByOrderId(orderId))
                                .build();
        }

        @GetMapping()
        public ApiResponse<List<OrderResponse>> getAllOrders() {
                return ApiResponse.<List<OrderResponse>>builder()
                                .result(orderService.getAllOrders())
                                .build();
        }

        @GetMapping("/filter")
        public ApiResponse<List<OrderResponse>> getAllOrdersByOrderStatus(@RequestParam String orderStatus) {
                return ApiResponse.<List<OrderResponse>>builder()
                                .result(orderService.getAllOrdersByOrderStatus(orderStatus))
                                .build();
        }

        @GetMapping("/my-orders")
        public ApiResponse<List<OrderResponse>> getAllOrderByUser() {
                return ApiResponse.<List<OrderResponse>>builder()
                                .result(orderService.getAllOrdersByUser())
                                .build();
        }

        @PutMapping("/{orderId}")
        public ApiResponse<OrderResponse> changeOrderStatus(
                        @PathVariable String orderId,
                        @RequestParam String orderStatus,
                        HttpServletRequest request) {

                String ipAddr = request.getRemoteAddr();

                return ApiResponse.<OrderResponse>builder()
                                .message("Đã cập nhật trạng thái thanh toán")
                                .result(orderService.changeOrderStatus(orderId, orderStatus, ipAddr))
                                .build();
        }

        @GetMapping("/user/{userId}")
        public ApiResponse<Page<OrderResponse>> getOrdersByUserId(
                        @PathVariable String userId,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "5") int size) {
                return ApiResponse.<Page<OrderResponse>>builder()
                                .message("Lấy danh sách đơn hàng theo userId")
                                .result(orderService.getOrdersByUserId(userId, page, size))
                                .build();
        }

        @GetMapping("/statistics/user/{userId}")
        public ApiResponse<UserOrderStatisticsResponse> getOrderStatisticsByUserId(
                        @PathVariable String userId) {

                return ApiResponse.<UserOrderStatisticsResponse>builder()
                                .message("Thống kê đơn hàng theo userId")
                                .result(orderService.getOrderStatisticsByUserId(userId))
                                .build();
        }

        @GetMapping("/search")
        public ApiResponse<Page<OrderResponse>> searchOrders(

                        // 🔍 SEARCH
                        @RequestParam(required = false) String orderCode,
                        @RequestParam(required = false) String recipientName,
                        @RequestParam(required = false) String recipientPhone,

                        // 🎯 FILTER
                        @RequestParam(required = false) String orderStatus,
                        @RequestParam(required = false) String paymentStatus,
                        @RequestParam(required = false) String paymentMethod,

                        // 📅 DATE
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,

                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate,

                        // 📄 PAGINATION
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "100") int size) {

                return ApiResponse.<Page<OrderResponse>>builder()
                                .result(orderService.searchOrders(
                                                orderCode,
                                                recipientName,
                                                recipientPhone,
                                                orderStatus,
                                                paymentStatus,
                                                paymentMethod,
                                                fromDate,
                                                toDate,
                                                page,
                                                size))
                                .build();
        }

        @GetMapping("/statistics")
        public ApiResponse<OrderStatisticsResponse> getOrderStatistics() {
                return ApiResponse.<OrderStatisticsResponse>builder()
                                .result(orderService.getOrderStatistics())
                                .build();
        }
}
