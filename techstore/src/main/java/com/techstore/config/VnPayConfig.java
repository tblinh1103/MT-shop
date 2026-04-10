package com.techstore.config;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.util.*;
import org.springframework.stereotype.Component;

@Component
public class VnPayConfig {

    public static String vnp_TmnCode = "A08OHGOH";
    public static String vnp_HashSecret = "NZ4H4GNPS8KG92B56R5NERM4M9565KOI";
    public static String vnp_PayUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
    public static String vnp_ReturnUrl = "http://localhost:8080/tech-store/api/payments/vnpay/return";

    public static String hmacSHA512(String key, String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA512");
            SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(), "HmacSHA512");
            mac.init(secretKey);
            byte[] raw = mac.doFinal(data.getBytes());
            StringBuilder hex = new StringBuilder();
            for (byte b : raw)
                hex.append(String.format("%02x", b));
            return hex.toString();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public static String hashAllFields(Map<String, String> fields) {
        List<String> fieldNames = new ArrayList<>(fields.keySet());
        Collections.sort(fieldNames);

        StringBuilder hashData = new StringBuilder();

        for (String fieldName : fieldNames) {
            String value = fields.get(fieldName);
            if (value != null && value.length() > 0) {
                hashData.append(fieldName).append("=").append(value).append("&");
            }
        }

        hashData.deleteCharAt(hashData.length() - 1);

        return hmacSHA512(vnp_HashSecret, hashData.toString());
    }
}