package com.creative.collaboration.service;

import com.creative.collaboration.dto.NotificationResponse;
import com.creative.collaboration.entity.Notification;
import com.creative.collaboration.repository.NotificationRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Set;

@Service
public class NotificationService {

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "follow",
            "like",
            "comment",
            "collaboration"
    );

    private final NotificationRepository repository;

    public NotificationService(
            NotificationRepository repository
    ) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getNotifications(
            String recipient
    ) {
        return repository
                .findByRecipientAndDismissedFalseOrderByCreatedAtDescIdDesc(
                        recipient
                )
                .stream()
                .map(NotificationResponse::from)
                .toList();
    }

    @Transactional
    public void dismiss(
            Long notificationId,
            String recipient
    ) {
        Notification notification = repository
                .findByIdAndRecipient(notificationId, recipient)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Notification not found"
                ));

        notification.dismiss();
    }

    /*
     * Call from your existing like, follow, comment,
     * or collaboration service after saving the action.
     *
     * recipient and actor must use the same identity
     * format as Principal.getName().
     */
    @Transactional
    public void create(
            String recipient,
            String actor,
            String actorDisplayName,
            String type
    ) {
        if (!ALLOWED_TYPES.contains(type)) {
            throw new IllegalArgumentException(
                    "Unsupported notification type"
            );
        }

        if (recipient == null || recipient.isBlank()) {
            throw new IllegalArgumentException(
                    "Notification recipient is required"
            );
        }

        if (actor == null || actor.isBlank()) {
            throw new IllegalArgumentException(
                    "Notification actor is required"
            );
        }

        // Do not notify someone about their own action.
        if (recipient.equals(actor)) {
            return;
        }

        String displayName =
                actorDisplayName == null || actorDisplayName.isBlank()
                        ? "Someone"
                        : actorDisplayName.trim();

        if (displayName.length() > 150) {
            displayName = displayName.substring(0, 150);
        }

        String message = switch (type) {
            case "follow" ->
                    displayName + " started following you.";
            case "like" ->
                    displayName + " liked your post.";
            case "comment" ->
                    displayName + " commented on your post.";
            case "collaboration" ->
                    displayName + " invited you to collaborate.";
            default ->
                    throw new IllegalArgumentException(
                            "Unsupported notification type"
                    );
        };

        repository.save(
                new Notification(recipient, message, type)
        );
    }
}