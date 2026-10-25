package com.creative.collaboration.dto;

import com.creative.collaboration.entity.Notification;
import java.time.Instant;

public record NotificationResponse(
        Long id,
        String message,
        String type,
        Instant createdAt
) {
    public static NotificationResponse from(
            Notification notification
    ) {
        return new NotificationResponse(
                notification.getId(),
                notification.getMessage(),
                notification.getType(),
                notification.getCreatedAt()
        );
    }
}