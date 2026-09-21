package com.creative.collaboration.dto;

public record UserResponse(
        Long id,
        String username,
        String email,
        String role,
        boolean active
) {
}