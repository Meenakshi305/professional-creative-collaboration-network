package com.creative.collaboration.controller;

import com.creative.collaboration.dto.CreateEventRequest;
import com.creative.collaboration.dto.EventRegistrationResponse;
import com.creative.collaboration.dto.EventResponse;
import com.creative.collaboration.dto.UpdateEventRequest;
import com.creative.collaboration.entity.EventStatus;
import com.creative.collaboration.entity.EventType;
import com.creative.collaboration.service.EventService;

import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/events")
public class EventController {

    private final EventService eventService;

    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    // CREATE EVENT
    @PostMapping
    public ResponseEntity<EventResponse> createEvent(
            @RequestBody CreateEventRequest request,
            @RequestHeader("X-User-Id") Long userId
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(eventService.createEvent(request, userId));
    }

    // LIST EVENTS
    @GetMapping
    public ResponseEntity<List<EventResponse>> getEvents(
            @RequestParam(required = false) EventStatus status,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) EventType eventType
    ) {
        return ResponseEntity.ok(
                eventService.getEvents(status, city, category, eventType)
        );
    }

    // GET EVENT
    @GetMapping("/{eventId}")
    public ResponseEntity<EventResponse> getEvent(
            @PathVariable Long eventId
    ) {
        return ResponseEntity.ok(
                eventService.getEventById(eventId)
        );
    }

    // UPDATE EVENT / PUBLISH EVENT
    @PatchMapping("/{eventId}")
    public ResponseEntity<EventResponse> updateEvent(
            @PathVariable Long eventId,
            @RequestBody UpdateEventRequest request
    ) {
        return ResponseEntity.ok(
                eventService.updateEvent(eventId, request)
        );
    }

    // CANCEL EVENT
    @DeleteMapping("/{eventId}")
    public ResponseEntity<Void> deleteEvent(
            @PathVariable Long eventId
    ) {
        eventService.deleteEvent(eventId);
        return ResponseEntity.noContent().build();
    }

    // REGISTER FOR EVENT
    @PostMapping("/{eventId}/registrations")
    public ResponseEntity<EventRegistrationResponse> registerForEvent(
            @PathVariable Long eventId,
            @RequestHeader("X-User-Id") Long userId
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(eventService.registerForEvent(eventId, userId));
    }

    // LIST EVENT REGISTRATIONS
    @GetMapping("/{eventId}/registrations")
    public ResponseEntity<List<EventRegistrationResponse>>
    getEventRegistrations(
            @PathVariable Long eventId
    ) {
        return ResponseEntity.ok(
                eventService.getEventRegistrations(eventId)
        );
    }

    // UPLOAD IMAGE TO MEGA THROUGH EVENT SERVICE
    @PostMapping(
            value = "/{eventId}/image",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<EventResponse> uploadEventImage(
            @PathVariable Long eventId,
            @RequestParam("file") MultipartFile file,
            Authentication authentication
    ) {
        if (authentication == null
                || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Please sign in again."
            );
        }

        return ResponseEntity.ok(
                eventService.uploadEventImage(
                        eventId,
                        authentication.getName(),
                        file
                )
        );
    }

    // RETRIEVE IMAGE FROM MEGA THROUGH EVENT SERVICE
    @GetMapping("/{eventId}/image")
    public ResponseEntity<byte[]> viewEventImage(
            @PathVariable Long eventId
    ) {
        EventService.EventImageContent image =
                eventService.getEventImage(eventId);

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .header("X-Content-Type-Options", "nosniff")
                .contentType(
                        MediaType.parseMediaType(image.contentType())
                )
                .body(image.bytes());
    }
}