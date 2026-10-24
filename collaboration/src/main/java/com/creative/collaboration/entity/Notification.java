package com.creative.collaboration.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(
        name = "notifications",
        indexes = {
                @Index(
                        name = "idx_notification_recipient",
                        columnList = "recipient,dismissed,createdAt"
                )
        }
)
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String recipient;

    @Column(nullable = false, length = 500)
    private String message;

    @Column(nullable = false, length = 30)
    private String type;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private boolean dismissed = false;

    protected Notification() {
    }

    public Notification(
            String recipient,
            String message,
            String type
    ) {
        this.recipient = recipient;
        this.message = message;
        this.type = type;
        this.createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public String getRecipient() {
        return recipient;
    }

    public String getMessage() {
        return message;
    }

    public String getType() {
        return type;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public boolean isDismissed() {
        return dismissed;
    }

    public void dismiss() {
        this.dismissed = true;
    }
}