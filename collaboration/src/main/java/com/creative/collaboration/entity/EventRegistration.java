package com.creative.collaboration.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "event_registrations",
        uniqueConstraints = {
                @UniqueConstraint(
                        columnNames = {
                                "event_id",
                                "user_id"
                        }
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventRegistration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "event_id",
            nullable = false
    )
    private Event event;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "user_id",
            nullable = false
    )
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RegistrationStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AttendanceStatus attendanceStatus;

    @Column(nullable = false, updatable = false)
    private LocalDateTime registeredAt;

    @Column
    private LocalDateTime cancelledAt;

    @PrePersist
    public void beforeInsert() {

        if (registeredAt == null) {
            registeredAt = LocalDateTime.now();
        }

        if (status == null) {
            status = RegistrationStatus.PENDING;
        }

        if (attendanceStatus == null) {
            attendanceStatus = AttendanceStatus.REGISTERED;
        }
    }
}
