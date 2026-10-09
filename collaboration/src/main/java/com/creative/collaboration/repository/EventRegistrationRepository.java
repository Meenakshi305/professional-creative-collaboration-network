package com.creative.collaboration.repository;

import com.creative.collaboration.entity.EventRegistration;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EventRegistrationRepository
        extends JpaRepository<EventRegistration, Long> {

    boolean existsByEventIdAndUserId(
            Long eventId,
            Long userId
    );

    Optional<EventRegistration>
    findByEventIdAndUserId(
            Long eventId,
            Long userId
    );

    List<EventRegistration>
    findByEventId(
            Long eventId
    );

    List<EventRegistration>
    findByUserId(
            Long userId
    );

    long countByEventIdAndStatusNot(
            Long eventId,
            com.creative.collaboration.entity.RegistrationStatus status
    );
}
