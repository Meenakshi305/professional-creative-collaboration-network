package com.creative.collaboration.dto;

import com.creative.collaboration.entity.enums.AccountType;

public record AuthResponse(
        Long userId,
        String fullName,
        String username,
        String email,
        AccountType accountType,
        String role,
        String token,
        String message
) {
}
