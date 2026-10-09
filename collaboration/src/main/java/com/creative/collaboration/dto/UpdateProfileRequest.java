package com.creative.collaboration.dto;

public record UpdateProfileRequest(

        String bio,

        String skills,

        String achievements,

        String profileImageUrl

) {
}