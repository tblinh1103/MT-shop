package com.techstore.service;

import com.techstore.dto.request.OrderItemRequest;
import com.techstore.dto.request.OrderRequest;
import com.techstore.dto.response.OrderItemResponse;
import com.techstore.dto.response.OrderResponse;
import com.techstore.dto.response.OrderStatisticsResponse;
import com.techstore.dto.response.UserOrderStatisticsResponse;
import com.techstore.entity.*;
import com.techstore.enums.OrderStatus;
import com.techstore.enums.PaymentStatus;
import com.techstore.exception.AppException;
import com.techstore.exception.ErrorCode;
import com.techstore.mapper.OrderItemMapper;
import com.techstore.mapper.OrderMapper;
import com.techstore.mapper.PaymentMapper;
import com.techstore.repository.*;
import com.techstore.specification.OrderSpecification;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final ProductVariantRepository productVariantRepository;
    private final DiscountRepository discountRepository;

    private final OrderMapper orderMapper;
    private final OrderItemMapper orderItemMapper;
    private final PaymentMapper paymentMapper;

    public OrderResponse createOrder(OrderRequest request) {

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        Discount discount = null;
        if (request.getDiscountCode() != null) {
            discount = discountRepository.findByCode(request.getDiscountCode())
                    .orElseThrow(() -> new AppException(ErrorCode.DISCOUNT_NOT_EXISTED));

            if (discount.getQuantity() <= 0) {
                throw new AppException(ErrorCode.DISCOUNT_INVALID);
            }
        }

        Order order = orderMapper.toOrder(request);
        order.setUser(user);
        order.setOrderStatus(OrderStatus.PENDING.name());

        List<OrderItem> orderItems = new ArrayList<>();
        for (OrderItemRequest itemRequest : request.getOrderItems()) {
            ProductVariant variant = productVariantRepository.findById(itemRequest.getProductVariantId())
                    .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_VARIANT_NOT_FOUNT));

            if (variant.getStock() < itemRequest.getQuantity())
                throw new AppException(ErrorCode.OUT_OF_STOCK);

            // Trừ kho
            variant.setStock(variant.getStock() - itemRequest.getQuantity());
            productVariantRepository.save(variant);

            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .productVariant(variant)
                    .quantity(itemRequest.getQuantity())
                    .price(itemRequest.getPrice())
                    .build();

            orderItems.add(orderItem);
        }

        order.setOrderItems(orderItems);

        Payment payment = Payment.builder()
                .order(order)
                .amount(request.getTotalAmount())
                .paymentMethod(request.getPaymentMethod())
                .paymentStatus(PaymentStatus.PENDING.name())
                .build();

        order.setPayment(payment);

        if (discount != null) {
            discount.setQuantity(discount.getQuantity() - 1);
            discountRepository.save(discount);
        }

        order = orderRepository.save(order);

        List<OrderItemResponse> itemResponses = new ArrayList<>();

        for (OrderItem item : order.getOrderItems()) {
            itemResponses.add(orderItemMapper.toOrderItemResponse(item));
        }

        OrderResponse response = orderMapper.toOrderResponse(order);

        response.setOrderItems(itemResponses);
        response.setPayment(paymentMapper.toPaymentResponse(order.getPayment()));

        return response;
    }

    public OrderResponse getOrderByOrderId(String orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_EXISTED));

        OrderResponse orderResponse = orderMapper.toOrderResponse(order);

        List<OrderItemResponse> orderItemResponses = new ArrayList<>();

        for (OrderItem item : order.getOrderItems()) {
            orderItemResponses.add(orderItemMapper.toOrderItemResponse(item));
        }

        orderResponse.setOrderItems(orderItemResponses);
        orderResponse.setPayment(paymentMapper.toPaymentResponse(order.getPayment()));

        return orderResponse;
    }

    public List<OrderResponse> getAllOrders() {
        List<Order> orders = orderRepository.findAllByOrderByCreatedAtDesc();

        List<OrderResponse> orderResponses = new ArrayList<>();
        for (Order order : orders) {
            OrderResponse orderResponse = orderMapper.toOrderResponse(order);

            List<OrderItemResponse> orderItemResponses = new ArrayList<>();
            for (OrderItem orderItem : order.getOrderItems()) {
                orderItemResponses.add(orderItemMapper.toOrderItemResponse(orderItem));
            }
            orderResponse.setOrderItems(orderItemResponses);

            orderResponse.setPayment(paymentMapper.toPaymentResponse(order.getPayment()));

            orderResponses.add(orderResponse);
        }

        return orderResponses;
    }

    public List<OrderResponse> getAllOrdersByOrderStatus(String orderStatus) {
        List<Order> orders = orderRepository.findAllByOrderStatusOrderByCreatedAtDesc(orderStatus);

        List<OrderResponse> orderResponses = new ArrayList<>();
        for (Order order : orders) {
            OrderResponse orderResponse = orderMapper.toOrderResponse(order);

            List<OrderItemResponse> orderItemResponses = new ArrayList<>();
            for (OrderItem orderItem : order.getOrderItems()) {
                orderItemResponses.add(orderItemMapper.toOrderItemResponse(orderItem));
            }
            orderResponse.setOrderItems(orderItemResponses);

            orderResponse.setPayment(paymentMapper.toPaymentResponse(order.getPayment()));

            orderResponses.add(orderResponse);
        }

        return orderResponses;
    }

    public OrderResponse changeOrderStatus(String orderId, String orderStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_EXISTED));

        order.setOrderStatus(orderStatus);

        order = orderRepository.save(order);

        OrderResponse orderResponse = orderMapper.toOrderResponse(order);

        List<OrderItemResponse> orderItemResponses = new ArrayList<>();
        for (OrderItem item : order.getOrderItems()) {
            orderItemResponses.add(orderItemMapper.toOrderItemResponse(item));
        }

        orderResponse.setOrderItems(orderItemResponses);
        orderResponse.setPayment(paymentMapper.toPaymentResponse(order.getPayment()));

        return orderResponse;
    }

    public List<OrderResponse> getAllOrdersByUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        List<Order> orders = orderRepository.findAllByUser_UserIdOrderByCreatedAtDesc(user.getUserId());

        List<OrderResponse> orderResponses = new ArrayList<>();
        for (Order order : orders) {
            OrderResponse orderResponse = orderMapper.toOrderResponse(order);

            List<OrderItemResponse> orderItemResponses = new ArrayList<>();
            for (OrderItem orderItem : order.getOrderItems()) {
                orderItemResponses.add(orderItemMapper.toOrderItemResponse(orderItem));
            }
            orderResponse.setOrderItems(orderItemResponses);

            orderResponse.setPayment(paymentMapper.toPaymentResponse(order.getPayment()));

            orderResponses.add(orderResponse);
        }

        return orderResponses;
    }

    public Page<OrderResponse> getOrdersByUserId(String userId, int page, int size) {

        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by("createdAt").descending() // thay cho OrderByCreatedAtDesc
        );

        Page<Order> orders = orderRepository.findAllByUser_UserId(userId, pageable);

        return orders.map(order -> {
            OrderResponse orderResponse = orderMapper.toOrderResponse(order);

            List<OrderItemResponse> orderItems = order.getOrderItems().stream()
                    .map(orderItemMapper::toOrderItemResponse)
                    .toList();

            orderResponse.setOrderItems(orderItems);
            orderResponse.setPayment(paymentMapper.toPaymentResponse(order.getPayment()));

            return orderResponse;
        });
    }

    public UserOrderStatisticsResponse getOrderStatisticsByUserId(String userId) {

        List<Object[]> results = orderRepository.getOrderStatisticsByUserId(userId);

        if (results.isEmpty()) {
            return UserOrderStatisticsResponse.builder()
                    .totalOrders(0)
                    .completedOrders(0)
                    .cancelledOrders(0)
                    .totalCompletedAmount(0)
                    .cancelRate(0)
                    .rating("NO_DATA")
                    .build();
        }

        Object[] result = results.get(0); // 👈 LẤY DÒNG ĐẦU

        long totalOrders = result[0] == null ? 0 : ((Number) result[0]).longValue();
        long completedOrders = result[1] == null ? 0 : ((Number) result[1]).longValue();
        long cancelledOrders = result[2] == null ? 0 : ((Number) result[2]).longValue();
        double totalCompletedAmount = result[3] == null ? 0 : ((Number) result[3]).doubleValue();

        double cancelRate = totalOrders == 0 ? 0 : (cancelledOrders * 100.0 / totalOrders);

        String rating;
        if (cancelRate <= 10)
            rating = "GOOD";
        else if (cancelRate <= 30)
            rating = "AVERAGE";
        else
            rating = "BAD";

        return UserOrderStatisticsResponse.builder()
                .totalOrders(totalOrders)
                .completedOrders(completedOrders)
                .cancelledOrders(cancelledOrders)
                .totalCompletedAmount(totalCompletedAmount)
                .cancelRate(cancelRate)
                .rating(rating)
                .build();
    }

    public Page<OrderResponse> searchOrders(
            String orderCode,
            String recipientName,
            String recipientPhone,
            String orderStatus,
            String paymentStatus,
            String paymentMethod,
            LocalDateTime fromDate,
            LocalDateTime toDate,
            int page,
            int size) {

        Specification<Order> spec = OrderSpecification.filter(
                orderCode,
                recipientName,
                recipientPhone,
                orderStatus,
                paymentStatus,
                paymentMethod,
                fromDate,
                toDate);

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        Page<Order> orderPage = orderRepository.findAll(spec, pageable);

        return orderPage.map(order -> {
            OrderResponse res = orderMapper.toOrderResponse(order);

            List<OrderItemResponse> items = order.getOrderItems().stream()
                    .map(orderItemMapper::toOrderItemResponse)
                    .toList();

            res.setOrderItems(items);
            res.setPayment(paymentMapper.toPaymentResponse(order.getPayment()));

            return res;
        });
    }

    public OrderStatisticsResponse getOrderStatistics() {
        return orderRepository.getOrderStatistics();
    }
}
