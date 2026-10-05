package com.creative.collaboration.dto;

import com.creative.collaboration.entity.EventStatus;
import com.creative.collaboration.entity.EventType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record EventResponse(

        Long id,

        String title,

        String description,

        String category,

        String city,

        String venue,

        LocalDateTime startDateTime,

        LocalDateTime endDateTime,

        EventStatus status,

        EventType eventType,

        Integer capacity,

        BigDecimal price,

        Long createdBy,

        LocalDateTime createdAt,

        LocalDateTime updatedAt

) {
}
