package com.techstore.controller;

import com.techstore.config.VnPayConfig;
import com.techstore.dto.response.ApiResponse;
import com.techstore.dto.response.PaymentResponse;
import com.techstore.service.PaymentService;
import com.techstore.entity.Payment;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import com.techstore.repository.PaymentRepository;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.HashMap;
import org.springframework.http.ResponseEntity;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PaymentController {

    private final PaymentService paymentService;
    private final PaymentRepository paymentRepository;

    // =========================
    // ADMIN (COD)
    // =========================
    @PutMapping("/{paymentId}")
    public ApiResponse<PaymentResponse> changePaymentStatus(
            @PathVariable String paymentId,
            @RequestParam String paymentStatus) {
        return ApiResponse.<PaymentResponse>builder()
                .message("Đã cập nhật trạng thái thanh toán")
                .result(paymentService.changePaymentStatus(paymentId, paymentStatus))
                .build();
    }

    // =========================
    // CREATE VNPAY URL
    // =========================
    @GetMapping("/{paymentId}/vnpay")
    public ApiResponse<String> createVnpay(
            @PathVariable String paymentId,
            HttpServletRequest request) {

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow();

        String url = paymentService.createVnpayPayment(payment, request);

        return ApiResponse.<String>builder()
                .result(url)
                .build();
    }

    // =========================
    // VNPAY RETURN
    // =========================
    @GetMapping("/vnpay/return")
    public void vnpayReturn(HttpServletRequest request,
            HttpServletResponse response) throws IOException {

        Map<String, String> fields = new HashMap<>();
        request.getParameterMap().forEach((key, value) -> {
            fields.put(key, value[0]);
        });

        String txnRef = fields.get("vnp_TxnRef");

        Payment payment = paymentRepository.findByTxnRef(txnRef)
                .orElseThrow();

        String orderId = payment.getOrder().getOrderId();

        String responseCode = fields.get("vnp_ResponseCode");

        if ("00".equals(responseCode)) {
            paymentService.handleVnpayCallback(fields);
            response.sendRedirect(
                    "http://127.0.0.1:5500/FE_END_USER/order-confirmation.html?orderId=" + orderId);
        } else {
            response.sendRedirect("http://127.0.0.1:5500/FE_END_USER/404.html");
        }
    }

    // =========================
    // VNPAY IPN
    // =========================
    @PostMapping("/vnpay/ipn")
    public ResponseEntity<String> vnpayIpn(HttpServletRequest request) {
        System.out.println("HANDLE CALLBACK CALLED");
        // Lấy params
        Map<String, String> fields = new HashMap<>();
        request.getParameterMap().forEach((key, value) -> {
            fields.put(key, value[0]);
        });

        String vnp_SecureHash = fields.get("vnp_SecureHash");

        // Remove hash
        fields.remove("vnp_SecureHash");
        fields.remove("vnp_SecureHashType");

        // Verify checksum
        String signValue = VnPayConfig.hashAllFields(fields);

        if (!signValue.equals(vnp_SecureHash)) {
            return ResponseEntity.ok("{\"RspCode\":\"97\",\"Message\":\"Invalid Checksum\"}");
        }

        try {
            // Xử lý payment (CHỈ ở IPN)
            paymentService.handleVnpayCallback(fields);
        } catch (Exception e) {
            return ResponseEntity.ok("{\"RspCode\":\"99\",\"Message\":\"Unknown error\"}");
        }

        return ResponseEntity.ok("{\"RspCode\":\"00\",\"Message\":\"Confirm Success\"}");
    }

    // =========================
    // VNPAY REFUND
    // =========================
    @PostMapping("/{paymentId}/refund")
    public ApiResponse<String> refund(
            @PathVariable String paymentId,
            HttpServletRequest request) throws Exception {

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow();

        if (!"PAID".equals(payment.getPaymentStatus())) {
            throw new RuntimeException("Chưa thanh toán, không thể hoàn tiền");
        }

        // 🔥 truyền IP xuống service
        String ipAddr = request.getRemoteAddr();

        String result = paymentService.refundVnpay(payment, ipAddr);

        paymentRepository.save(payment);

        return ApiResponse.<String>builder()
                .result(result)
                .build();
    }
}
