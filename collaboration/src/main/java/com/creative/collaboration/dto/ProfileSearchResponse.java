package com.creative.collaboration.dto;

public record ProfileSearchResponse(
        Long userId,
        String fullName,
        String username,
        String skills,
        String bio,
        String profileImageUrl
) {
}