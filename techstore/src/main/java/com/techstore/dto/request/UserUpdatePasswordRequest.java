package com.techstore.dto.request;

import lombok.Data;

@Data
public class UserUpdatePasswordRequest {
    private String currentPassword;
    private String newPassword;
}
