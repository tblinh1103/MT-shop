package com.techstore.repository;

import com.techstore.entity.Payment;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, String> {

    java.util.Optional<Payment> findByTxnRef(String txnRef);

}
