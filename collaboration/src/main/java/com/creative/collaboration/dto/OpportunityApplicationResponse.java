package com.creative.collaboration.dto;

import java.time.LocalDateTime;

public record OpportunityApplicationResponse(

        Long applicationId,

        Long opportunityId,

        Long applicantId,

        String applicantUsername,

        String message,

        String status,

        LocalDateTime appliedAt

) {
}