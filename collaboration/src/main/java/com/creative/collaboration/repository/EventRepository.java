package com.creative.collaboration.repository;

import com.creative.collaboration.entity.Event;
import com.creative.collaboration.entity.EventStatus;
import com.creative.collaboration.entity.EventType;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface EventRepository
        extends JpaRepository<Event, Long> {

    List<Event> findByStatus(EventStatus status);

    List<Event> findByCityIgnoreCase(String city);

    List<Event> findByCategoryIgnoreCase(String category);

    List<Event> findByEventType(EventType eventType);

    List<Event> findByStatusAndCityIgnoreCase(
            EventStatus status,
            String city
    );

    List<Event> findByStatusAndCategoryIgnoreCase(
            EventStatus status,
            String category
    );

    List<Event> findByStatusAndEventType(
            EventStatus status,
            EventType eventType
    );

    // Call inside a transaction to prevent concurrent
    // registration requests from overbooking an event.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT e FROM Event e WHERE e.id = :eventId")
    Optional<Event> lockById(
            @Param("eventId") Long eventId
    );
}