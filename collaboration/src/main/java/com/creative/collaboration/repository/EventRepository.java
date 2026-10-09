package com.creative.collaboration.repository;

import com.creative.collaboration.entity.Event;
import com.creative.collaboration.entity.EventStatus;
import com.creative.collaboration.entity.EventType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

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
}
