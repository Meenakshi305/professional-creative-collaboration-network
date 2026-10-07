package com.creative.collaboration.dto;

import java.time.LocalDate;


public record ExperienceResponse(

        Long id,

        Long userId,

        String jobTitle,

        String organisation,

        LocalDate startDate,

        LocalDate endDate,

        boolean currentRole,

        String description

) {
}