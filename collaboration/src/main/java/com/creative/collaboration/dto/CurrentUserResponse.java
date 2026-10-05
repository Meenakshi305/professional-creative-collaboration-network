package com.creative.collaboration.dto;

import com.creative.collaboration.entity.enums.AccountType;

import java.time.LocalDate;

public record CurrentUserResponse(
        Long userId,
        String fullName,
        String username,
        String email,
        LocalDate dateOfBirth,
        AccountType accountType,
        String role,
        boolean active
) {
}
