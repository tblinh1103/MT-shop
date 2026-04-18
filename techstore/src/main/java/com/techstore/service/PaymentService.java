package com.techstore.service;

import com.techstore.config.VnPayConfig;
import com.techstore.dto.response.PaymentResponse;
import com.techstore.entity.Payment;
import com.techstore.enums.PaymentStatus;
import com.techstore.exception.AppException;
import com.techstore.exception.ErrorCode;
import com.techstore.mapper.PaymentMapper;
import com.techstore.repository.PaymentRepository;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.net.URLEncoder;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.Date;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final PaymentMapper paymentMapper;

    // =========================
    // ✅ ADMIN (COD)
    // =========================
    public PaymentResponse changePaymentStatus(String paymentId, String paymentStatus) {

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_NOT_EXISTED));

        // ❗ chỉ cho phép CASH
        if (!payment.getPaymentMethod().equals("CASH")) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        // ❗ tránh update lại
        if (payment.getPaymentStatus().equals(PaymentStatus.PAID.name())) {
            return paymentMapper.toPaymentResponse(payment);
        }

        payment.setPaymentStatus(paymentStatus);

        if (paymentStatus.equals(PaymentStatus.PAID.name())) {
            payment.setPaidAt(LocalDateTime.now());
            payment.getOrder().setOrderStatus("COMPLETED");
        }

        payment = paymentRepository.save(payment);
        return paymentMapper.toPaymentResponse(payment);
    }

    // =========================
    // 🔥 CREATE VNPAY LINK
    // =========================
    public String createVnpayPayment(Payment payment, HttpServletRequest request) {

        String txnRef = payment.getPaymentId();

        Map<String, String> params = new HashMap<>();

        params.put("vnp_Version", "2.1.0");
        params.put("vnp_Command", "pay");
        params.put("vnp_TmnCode", VnPayConfig.vnp_TmnCode);

        params.put("vnp_Amount",
                payment.getAmount()
                        .multiply(BigDecimal.valueOf(100))
                        .longValue() + "");

        params.put("vnp_CurrCode", "VND");
        params.put("vnp_TxnRef", txnRef);
        params.put("vnp_OrderInfo", "Thanh toan don hang " + payment.getPaymentId());
        params.put("vnp_OrderType", "other");

        params.put("vnp_Locale", "vn");

        params.put("vnp_ReturnUrl", VnPayConfig.vnp_ReturnUrl);

        // 🔥 thời gian
        String createDate = new SimpleDateFormat("yyyyMMddHHmmss").format(new Date());
        params.put("vnp_CreateDate", createDate);

        Calendar cal = Calendar.getInstance();
        cal.add(Calendar.MINUTE, 15);
        String expireDate = new SimpleDateFormat("yyyyMMddHHmmss").format(cal.getTime());
        params.put("vnp_ExpireDate", expireDate);

        // 🔥 IP
        params.put("vnp_IpAddr", request.getRemoteAddr());

        // =========================
        // build query + hash
        // =========================
        List<String> fieldNames = new ArrayList<>(params.keySet());
        Collections.sort(fieldNames);

        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();

        for (int i = 0; i < fieldNames.size(); i++) {
            String fieldName = fieldNames.get(i);
            String fieldValue = params.get(fieldName);

            if (fieldValue != null && fieldValue.length() > 0) {

                // 🔥 HASH DATA (encode VALUE)
                hashData.append(fieldName);
                hashData.append('=');
                hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));

                // 🔥 QUERY (encode BOTH)
                query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII));
                query.append('=');
                query.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));

                if (i < fieldNames.size() - 1) {
                    hashData.append('&');
                    query.append('&');
                }
            }
        }

        String secureHash = VnPayConfig.hmacSHA512(
                VnPayConfig.vnp_HashSecret,
                hashData.toString());

        String paymentUrl = VnPayConfig.vnp_PayUrl
                + "?" + query
                + "&vnp_SecureHash=" + secureHash;

        // lưu txnRef
        payment.setTxnRef(txnRef);
        paymentRepository.save(payment);

        return paymentUrl;
    }

    // =========================
    // 🔥 VNPAY CALLBACK
    // =========================
    public void handleVnpayCallback(String txnRef, String responseCode) {

        Payment payment = paymentRepository.findByTxnRef(txnRef)
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_NOT_EXISTED));

        // ❗ tránh update 2 lần
        if (payment.getPaymentStatus().equals(PaymentStatus.PAID.name())) {
            return;
        }

        payment.setVnpResponseCode(responseCode);

        if ("00".equals(responseCode)) {
            payment.setPaymentStatus(PaymentStatus.PAID.name());
            payment.setPaidAt(LocalDateTime.now());
            payment.getOrder().setOrderStatus("CONFIRMED");
        } else {
            payment.setPaymentStatus(PaymentStatus.PENDING.name());
            payment.setPaidAt(LocalDateTime.now());
            payment.getOrder().setOrderStatus("CANCELLED");
        }

        paymentRepository.save(payment);
    }
}
