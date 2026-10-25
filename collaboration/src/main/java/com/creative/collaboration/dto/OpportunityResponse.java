package com.creative.collaboration.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record OpportunityResponse(

        Long id,

        String title,

        String description,

        String requirements,

        String location,

        LocalDate applicationDeadline,

        Long createdById,

        String createdByUsername,

        LocalDateTime createdAt,

        LocalDateTime updatedAt

) {
}