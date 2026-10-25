package com.creative.collaboration.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;


public record ExperienceRequest(

        @NotBlank(
                message = "Job title is required"
        )
        String jobTitle,


        @NotBlank(
                message = "Organisation is required"
        )
        String organisation,


        @NotNull(
                message = "Start date is required"
        )
        LocalDate startDate,


        LocalDate endDate,


        boolean currentRole,


        String description

) {
}