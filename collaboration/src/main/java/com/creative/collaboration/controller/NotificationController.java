package com.creative.collaboration.controller;

import com.creative.collaboration.dto.NotificationResponse;
import com.creative.collaboration.service.NotificationService;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService service;

    public NotificationController(
            NotificationService service
    ) {
        this.service = service;
    }

    @GetMapping
    public List<NotificationResponse> getNotifications(
            Principal principal
    ) {
        return service.getNotifications(
                authenticatedRecipient(principal)
        );
    }

    @PatchMapping("/{id}/dismiss")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void dismissNotification(
            @PathVariable("id") Long id,
            Principal principal
    ) {
        service.dismiss(
                id,
                authenticatedRecipient(principal)
        );
    }

    private String authenticatedRecipient(
            Principal principal
    ) {
        if (
                principal == null ||
                        principal.getName() == null ||
                        principal.getName().isBlank()
        ) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Authentication required"
            );
        }

        return principal.getName();
    }
}