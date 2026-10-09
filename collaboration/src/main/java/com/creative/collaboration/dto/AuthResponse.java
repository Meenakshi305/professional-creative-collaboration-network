package com.creative.collaboration.dto;

public record AuthResponse(

        Long userId,

        String fullName,

        String username,

        String email,

        String role,

        String token,

        String message

) {
}