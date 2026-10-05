package com.creative.collaboration.dto;

import com.creative.collaboration.entity.AttendanceStatus;
import com.creative.collaboration.entity.RegistrationStatus;

import java.time.LocalDateTime;

public record EventRegistrationResponse(

        Long id,

        Long eventId,

        String eventTitle,

        Long userId,

        String username,

        RegistrationStatus status,

        LocalDateTime registeredAt,

        LocalDateTime cancelledAt

) {
}
