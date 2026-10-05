package com.creative.collaboration.controller;

import com.creative.collaboration.dto.CreateEventRequest;
import com.creative.collaboration.dto.EventRegistrationResponse;
import com.creative.collaboration.dto.EventResponse;
import com.creative.collaboration.dto.UpdateEventRequest;
import com.creative.collaboration.entity.EventStatus;
import com.creative.collaboration.entity.EventType;
import com.creative.collaboration.service.EventService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events")
public class EventController {

    private final EventService eventService;


    public EventController(
            EventService eventService
    ) {

        this.eventService =
                eventService;
    }


    // =========================================================
    // POST /api/events
    // =========================================================

    @PostMapping
    public ResponseEntity<EventResponse>
    createEvent(

            @RequestBody
            CreateEventRequest request,

            @RequestHeader(
                    "X-User-Id"
            )
            Long userId

    ) {

        EventResponse response =
                eventService.createEvent(
                        request,
                        userId
                );


        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }


    // =========================================================
    // GET /api/events
    //
    // Examples:
    //
    // /api/events
    // /api/events?status=PUBLISHED
    // /api/events?city=Adelaide
    // /api/events?category=Photography
    // /api/events?eventType=PAID
    // =========================================================

    @GetMapping
    public ResponseEntity<List<EventResponse>>
    getEvents(

            @RequestParam(
                    required = false
            )
            EventStatus status,

            @RequestParam(
                    required = false
            )
            String city,

            @RequestParam(
                    required = false
            )
            String category,

            @RequestParam(
                    required = false
            )
            EventType eventType

    ) {

        return ResponseEntity.ok(

                eventService.getEvents(

                        status,

                        city,

                        category,

                        eventType
                )
        );
    }


    // =========================================================
    // GET /api/events/{eventId}
    // =========================================================

    @GetMapping("/{eventId}")
    public ResponseEntity<EventResponse>
    getEvent(

            @PathVariable
            Long eventId

    ) {

        return ResponseEntity.ok(

                eventService.getEventById(
                        eventId
                )
        );
    }


    // =========================================================
    // PATCH /api/events/{eventId}
    // =========================================================

    @PatchMapping("/{eventId}")
    public ResponseEntity<EventResponse>
    updateEvent(

            @PathVariable
            Long eventId,

            @RequestBody
            UpdateEventRequest request

    ) {

        return ResponseEntity.ok(

                eventService.updateEvent(
                        eventId,
                        request
                )
        );
    }


    // =========================================================
    // DELETE /api/events/{eventId}
    // =========================================================

    @DeleteMapping("/{eventId}")
    public ResponseEntity<Void>
    deleteEvent(

            @PathVariable
            Long eventId

    ) {

        eventService.deleteEvent(
                eventId
        );


        return ResponseEntity
                .noContent()
                .build();
    }


    // =========================================================
    // POST /api/events/{eventId}/registrations
    // =========================================================

    @PostMapping("/{eventId}/registrations")
    public ResponseEntity<EventRegistrationResponse>
    registerForEvent(

            @PathVariable
            Long eventId,

            @RequestHeader(
                    "X-User-Id"
            )
            Long userId

    ) {

        EventRegistrationResponse response =
                eventService.registerForEvent(
                        eventId,
                        userId
                );


        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }


    // =========================================================
    // GET /api/events/{eventId}/registrations
    // =========================================================

    @GetMapping("/{eventId}/registrations")
    public ResponseEntity<
            List<EventRegistrationResponse>
            >
    getEventRegistrations(

            @PathVariable
            Long eventId

    ) {

        return ResponseEntity.ok(

                eventService
                        .getEventRegistrations(
                                eventId
                        )
        );
    }
}
