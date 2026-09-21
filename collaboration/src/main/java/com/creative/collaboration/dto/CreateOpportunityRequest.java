package com.creative.collaboration.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

public record CreateOpportunityRequest(

        @NotBlank
        String title,

        @NotBlank
        String description,

        String requirements,

        String location,

        LocalDate applicationDeadline

) {
}