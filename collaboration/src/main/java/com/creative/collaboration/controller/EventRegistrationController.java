package com.creative.collaboration.controller;

import com.creative.collaboration.dto.EventRegistrationResponse;
import com.creative.collaboration.service.EventService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class EventRegistrationController {

    private final EventService eventService;


    public EventRegistrationController(
            EventService eventService
    ) {

        this.eventService =
                eventService;
    }


    // =========================================================
    // GET /api/users/{userId}/event-registrations
    // =========================================================

    @GetMapping(
            "/api/users/{userId}/event-registrations"
    )
    public ResponseEntity<
            List<EventRegistrationResponse>
            >
    getUserRegistrations(

            @PathVariable
            Long userId

    ) {

        return ResponseEntity.ok(

                eventService
                        .getUserRegistrations(
                                userId
                        )
        );
    }


    // =========================================================
    // GET /api/event-registrations/{registrationId}
    // =========================================================

    @GetMapping(
            "/api/event-registrations/{registrationId}"
    )
    public ResponseEntity<EventRegistrationResponse>
    getRegistration(

            @PathVariable
            Long registrationId

    ) {

        return ResponseEntity.ok(

                eventService
                        .getRegistrationById(
                                registrationId
                        )
        );
    }


    // =========================================================
    // PATCH
    // /api/event-registrations/{registrationId}/cancel
    // =========================================================

    @PatchMapping(
            "/api/event-registrations/{registrationId}/cancel"
    )
    public ResponseEntity<EventRegistrationResponse>
    cancelRegistration(

            @PathVariable
            Long registrationId

    ) {

        return ResponseEntity.ok(

                eventService
                        .cancelRegistration(
                                registrationId
                        )
        );
    }
}
