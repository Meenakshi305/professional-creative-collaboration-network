package com.creative.collaboration.dto;

import java.time.LocalDate;

public record CurrentUserResponse(

        Long userId,

        String fullName,

        String username,

        String email,

        LocalDate dateOfBirth,

        String role,

        boolean active

) {
}