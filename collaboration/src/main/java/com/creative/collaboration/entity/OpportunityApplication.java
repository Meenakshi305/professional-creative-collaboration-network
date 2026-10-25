package com.creative.collaboration.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "opportunity_applications",
        uniqueConstraints = {
                @UniqueConstraint(
                        columnNames = {
                                "opportunity_id",
                                "applicant_id"
                        }
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OpportunityApplication {

    @Id
    @GeneratedValue(
            strategy = GenerationType.IDENTITY
    )
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "opportunity_id",
            nullable = false
    )
    private Opportunity opportunity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "applicant_id",
            nullable = false
    )
    private User applicant;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(nullable = false)
    private String status;

    @Column(
            nullable = false,
            updatable = false
    )
    private LocalDateTime appliedAt;

    @PrePersist
    public void beforeInsert() {

        appliedAt = LocalDateTime.now();

        if (status == null) {
            status = "PENDING";
        }
    }
}
