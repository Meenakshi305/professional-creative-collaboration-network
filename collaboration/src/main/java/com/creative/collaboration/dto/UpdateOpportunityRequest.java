package com.creative.collaboration.dto;

import java.time.LocalDate;

public record UpdateOpportunityRequest(

        String title,

        String description,

        String requirements,

        String location,

        LocalDate applicationDeadline

) {
}