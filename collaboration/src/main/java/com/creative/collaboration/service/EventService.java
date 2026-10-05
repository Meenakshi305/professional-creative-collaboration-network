package com.creative.collaboration.service;

import com.creative.collaboration.dto.*;
import com.creative.collaboration.entity.*;
import com.creative.collaboration.exception.ResourceNotFoundException;
import com.creative.collaboration.repository.EventRegistrationRepository;
import com.creative.collaboration.repository.EventRepository;
import com.creative.collaboration.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class EventService {

    private final EventRepository eventRepository;

    private final EventRegistrationRepository
            registrationRepository;

    private final UserRepository userRepository;


    public EventService(
            EventRepository eventRepository,
            EventRegistrationRepository registrationRepository,
            UserRepository userRepository
    ) {

        this.eventRepository =
                eventRepository;

        this.registrationRepository =
                registrationRepository;

        this.userRepository =
                userRepository;
    }


    // =========================================================
    // CREATE EVENT
    // POST /api/events
    // =========================================================

    public EventResponse createEvent(
            CreateEventRequest request,
            Long userId
    ) {

        User user =
                findUser(userId);


        validateEventDates(
                request.startDateTime(),
                request.endDateTime()
        );


        if (request.capacity() == null
                || request.capacity() <= 0) {

            throw new IllegalArgumentException(
                    "Capacity must be greater than zero"
            );
        }


        EventType eventType =
                request.eventType() == null
                        ? EventType.FREE
                        : request.eventType();


        BigDecimal price =
                request.price() == null
                        ? BigDecimal.ZERO
                        : request.price();


        if (eventType == EventType.FREE) {

            price = BigDecimal.ZERO;

        } else if (price.compareTo(
                BigDecimal.ZERO) < 0) {

            throw new IllegalArgumentException(
                    "Price cannot be negative"
            );
        }


        Event event =
                Event.builder()

                        .title(request.title())

                        .description(
                                request.description()
                        )

                        .category(
                                request.category()
                        )

                        .city(
                                request.city()
                        )

                        .venue(
                                request.venue()
                        )

                        .startDateTime(
                                request.startDateTime()
                        )

                        .endDateTime(
                                request.endDateTime()
                        )

                        .status(
                                EventStatus.DRAFT
                        )

                        .eventType(
                                eventType
                        )

                        .capacity(
                                request.capacity()
                        )

                        .price(
                                price
                        )

                        .createdBy(
                                user
                        )

                        .build();


        Event savedEvent =
                eventRepository.save(event);


        return convertToEventResponse(
                savedEvent
        );
    }


    // =========================================================
    // GET ALL EVENTS
    // GET /api/events
    // =========================================================

    @Transactional(readOnly = true)
    public List<EventResponse> getEvents(
            EventStatus status,
            String city,
            String category,
            EventType eventType
    ) {

        List<Event> events;


        if (status != null
                && city != null
                && !city.isBlank()) {

            events =
                    eventRepository
                            .findByStatusAndCityIgnoreCase(
                                    status,
                                    city
                            );

        } else if (status != null
                && category != null
                && !category.isBlank()) {

            events =
                    eventRepository
                            .findByStatusAndCategoryIgnoreCase(
                                    status,
                                    category
                            );

        } else if (status != null
                && eventType != null) {

            events =
                    eventRepository
                            .findByStatusAndEventType(
                                    status,
                                    eventType
                            );

        } else if (status != null) {

            events =
                    eventRepository
                            .findByStatus(status);

        } else if (city != null
                && !city.isBlank()) {

            events =
                    eventRepository
                            .findByCityIgnoreCase(city);

        } else if (category != null
                && !category.isBlank()) {

            events =
                    eventRepository
                            .findByCategoryIgnoreCase(
                                    category
                            );

        } else if (eventType != null) {

            events =
                    eventRepository
                            .findByEventType(eventType);

        } else {

            events =
                    eventRepository.findAll();
        }


        return events.stream()

                .map(
                        this::convertToEventResponse
                )

                .toList();
    }


    // =========================================================
    // GET SINGLE EVENT
    // GET /api/events/{eventId}
    // =========================================================

    @Transactional(readOnly = true)
    public EventResponse getEventById(
            Long eventId
    ) {

        Event event =
                findEvent(eventId);


        return convertToEventResponse(
                event
        );
    }


    // =========================================================
    // UPDATE EVENT
    // PATCH /api/events/{eventId}
    // =========================================================

    public EventResponse updateEvent(
            Long eventId,
            UpdateEventRequest request
    ) {

        Event event =
                findEvent(eventId);


        if (request.title() != null) {

            event.setTitle(
                    request.title()
            );
        }


        if (request.description() != null) {

            event.setDescription(
                    request.description()
            );
        }


        if (request.category() != null) {

            event.setCategory(
                    request.category()
            );
        }


        if (request.city() != null) {

            event.setCity(
                    request.city()
            );
        }


        if (request.venue() != null) {

            event.setVenue(
                    request.venue()
            );
        }


        if (request.startDateTime() != null) {

            event.setStartDateTime(
                    request.startDateTime()
            );
        }


        if (request.endDateTime() != null) {

            event.setEndDateTime(
                    request.endDateTime()
            );
        }


        if (request.startDateTime() != null
                || request.endDateTime() != null) {

            validateEventDates(
                    event.getStartDateTime(),
                    event.getEndDateTime()
            );
        }


        if (request.status() != null) {

            event.setStatus(
                    request.status()
            );
        }


        if (request.eventType() != null) {

            event.setEventType(
                    request.eventType()
            );


            if (request.eventType()
                    == EventType.FREE) {

                event.setPrice(
                        BigDecimal.ZERO
                );
            }
        }


        if (request.capacity() != null) {

            if (request.capacity() <= 0) {

                throw new IllegalArgumentException(
                        "Capacity must be greater than zero"
                );
            }

            event.setCapacity(
                    request.capacity()
            );
        }


        if (request.price() != null) {

            if (request.price()
                    .compareTo(BigDecimal.ZERO) < 0) {

                throw new IllegalArgumentException(
                        "Price cannot be negative"
                );
            }

            event.setPrice(
                    request.price()
            );
        }


        if (event.getEventType()
                == EventType.FREE) {

            event.setPrice(
                    BigDecimal.ZERO
            );
        }


        Event updatedEvent =
                eventRepository.save(event);


        return convertToEventResponse(
                updatedEvent
        );
    }


    // =========================================================
    // DELETE EVENT
    // DELETE /api/events/{eventId}
    // =========================================================

    public void deleteEvent(
            Long eventId
    ) {

        Event event =
                findEvent(eventId);


        // Soft delete:
        // event remains in database
        // but becomes CANCELLED.

        event.setStatus(
                EventStatus.CANCELLED
        );


        eventRepository.save(event);
    }


    // =========================================================
    // REGISTER USER
    // POST /api/events/{eventId}/registrations
    // =========================================================

    public EventRegistrationResponse
    registerForEvent(
            Long eventId,
            Long userId
    ) {

        Event event =
                findEvent(eventId);


        User user =
                findUser(userId);


        if (event.getStatus()
                != EventStatus.PUBLISHED) {

            throw new IllegalStateException(
                    "Only published events can be registered for"
            );
        }


        if (event.getStartDateTime()
                .isBefore(LocalDateTime.now())) {

            throw new IllegalStateException(
                    "This event has already started"
            );
        }


        boolean alreadyRegistered =
                registrationRepository
                        .existsByEventIdAndUserId(
                                eventId,
                                userId
                        );


        if (alreadyRegistered) {

            throw new IllegalStateException(
                    "User is already registered for this event"
            );
        }


        long currentRegistrations =
                registrationRepository
                        .countByEventIdAndStatusNot(
                                eventId,
                                RegistrationStatus.CANCELLED
                        );


        if (currentRegistrations
                >= event.getCapacity()) {

            throw new IllegalStateException(
                    "Event is full"
            );
        }


        RegistrationStatus registrationStatus;


        if (event.getEventType()
                == EventType.PAID) {

            registrationStatus =
                    RegistrationStatus.PENDING;

        } else {

            registrationStatus =
                    RegistrationStatus.CONFIRMED;
        }


        EventRegistration registration =
                EventRegistration.builder()

                        .event(event)

                        .user(user)

                        .status(
                                registrationStatus
                        )

                        .attendanceStatus(
                                AttendanceStatus.REGISTERED
                        )

                        .build();


        EventRegistration savedRegistration =
                registrationRepository.save(
                        registration
                );


        return convertToRegistrationResponse(
                savedRegistration
        );
    }


    // =========================================================
    // GET EVENT REGISTRATIONS
    // GET /api/events/{eventId}/registrations
    // =========================================================

    @Transactional(readOnly = true)
    public List<EventRegistrationResponse>
    getEventRegistrations(
            Long eventId
    ) {

        findEvent(eventId);


        return registrationRepository
                .findByEventId(eventId)

                .stream()

                .map(
                        this::convertToRegistrationResponse
                )

                .toList();
    }


    // =========================================================
    // GET USER REGISTRATIONS
    // GET /api/users/{userId}/event-registrations
    // =========================================================

    @Transactional(readOnly = true)
    public List<EventRegistrationResponse>
    getUserRegistrations(
            Long userId
    ) {

        findUser(userId);


        return registrationRepository
                .findByUserId(userId)

                .stream()

                .map(
                        this::convertToRegistrationResponse
                )

                .toList();
    }


    // =========================================================
    // GET REGISTRATION
    // GET /api/event-registrations/{registrationId}
    // =========================================================

    @Transactional(readOnly = true)
    public EventRegistrationResponse
    getRegistrationById(
            Long registrationId
    ) {

        EventRegistration registration =
                findRegistration(
                        registrationId
                );


        return convertToRegistrationResponse(
                registration
        );
    }


    // =========================================================
    // CANCEL REGISTRATION
    // PATCH /api/event-registrations/{registrationId}/cancel
    // =========================================================

    public EventRegistrationResponse
    cancelRegistration(
            Long registrationId
    ) {

        EventRegistration registration =
                findRegistration(
                        registrationId
                );


        if (registration.getStatus()
                == RegistrationStatus.CANCELLED) {

            throw new IllegalStateException(
                    "Registration is already cancelled"
            );
        }


        registration.setStatus(
                RegistrationStatus.CANCELLED
        );


        registration.setCancelledAt(
                LocalDateTime.now()
        );


        EventRegistration updatedRegistration =
                registrationRepository.save(
                        registration
                );


        return convertToRegistrationResponse(
                updatedRegistration
        );
    }


    // =========================================================
    // FIND EVENT
    // =========================================================

    private Event findEvent(
            Long eventId
    ) {

        return eventRepository
                .findById(eventId)

                .orElseThrow(
                        () ->
                                new ResourceNotFoundException(
                                        "Event not found with id: "
                                                + eventId
                                )
                );
    }


    // =========================================================
    // FIND USER
    // =========================================================

    private User findUser(
            Long userId
    ) {

        return userRepository
                .findById(userId)

                .orElseThrow(
                        () ->
                                new ResourceNotFoundException(
                                        "User not found with id: "
                                                + userId
                                )
                );
    }


    // =========================================================
    // FIND REGISTRATION
    // =========================================================

    private EventRegistration findRegistration(
            Long registrationId
    ) {

        return registrationRepository
                .findById(registrationId)

                .orElseThrow(
                        () ->
                                new ResourceNotFoundException(
                                        "Event registration not found with id: "
                                                + registrationId
                                )
                );
    }


    // =========================================================
    // VALIDATE DATES
    // =========================================================

    private void validateEventDates(
            LocalDateTime startDateTime,
            LocalDateTime endDateTime
    ) {

        if (startDateTime == null
                || endDateTime == null) {

            throw new IllegalArgumentException(
                    "Start date and end date are required"
            );
        }


        if (!endDateTime.isAfter(
                startDateTime
        )) {

            throw new IllegalArgumentException(
                    "End date must be after start date"
            );
        }
    }


    // =========================================================
    // EVENT -> RESPONSE
    // =========================================================

    private EventResponse convertToEventResponse(
            Event event
    ) {

        return new EventResponse(

                event.getId(),

                event.getTitle(),

                event.getDescription(),

                event.getCategory(),

                event.getCity(),

                event.getVenue(),

                event.getStartDateTime(),

                event.getEndDateTime(),

                event.getStatus(),

                event.getEventType(),

                event.getCapacity(),

                event.getPrice(),

                event.getCreatedBy().getId(),

                event.getCreatedAt(),

                event.getUpdatedAt()
        );
    }


    // =========================================================
    // REGISTRATION -> RESPONSE
    // =========================================================

    private EventRegistrationResponse
    convertToRegistrationResponse(
            EventRegistration registration
    ) {

        return new EventRegistrationResponse(

                registration.getId(),

                registration.getEvent().getId(),

                registration.getEvent().getTitle(),

                registration.getUser().getId(),

                registration.getUser().getUsername(),

                registration.getStatus(),

                registration.getAttendanceStatus(),

                registration.getRegisteredAt(),

                registration.getCancelledAt()
        );
    }
}
