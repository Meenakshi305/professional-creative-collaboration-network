package com.creative.collaboration.dto;

import java.util.List;

public record SuggestedProfileResponse(

        Long userId,

        String fullName,

        String username,

        String skills,

        String bio,

        String profileImageUrl,

        List<String> matchedSkills,

        int matchScore

) {
}