package com.techstore.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_discount", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "user_id", "discount_id" })
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDiscount {

    @Id
    @Column(name = "id")
    private String id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "discount_id", nullable = false)
    private String discountId;

    @Column(name = "used_at")
    private LocalDateTime usedAt;
}