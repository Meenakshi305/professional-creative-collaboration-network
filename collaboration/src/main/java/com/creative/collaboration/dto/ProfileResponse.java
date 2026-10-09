package com.creative.collaboration.dto;

public record ProfileResponse(

        Long userId,

        String username,

        String bio,

        String skills,

        String achievements,

        String profileImageUrl

) {
}