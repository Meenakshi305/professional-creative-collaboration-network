package com.creative.collaboration.guardian;

import com.creative.collaboration.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.Instant;

@Entity @Table(name = "guardian_consents", indexes = {
    @Index(name = "idx_guardian_pending", columnList = "guardian_email,status"),
    @Index(name = "idx_guardian_links", columnList = "guardian_id,status")})
@Getter @Setter @NoArgsConstructor
public class ParentAccountConsent {
    public enum Status { PENDING, APPROVED, DECLINED, REVOKED }
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @OneToOne(fetch = FetchType.LAZY) @JoinColumn(name = "child_id", nullable = false, unique = true)
    private User child;
    @Column(name = "guardian_email", nullable = false, length = 150) private String guardianEmail;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "guardian_id") private User guardian;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private Status status = Status.PENDING;
    @Column(nullable = false) private Instant createdAt = Instant.now();
    @Column(nullable = false) private Instant expiresAt = Instant.now().plusSeconds(7 * 86400);
    private Instant decidedAt;
    private Instant revokedAt;
    @Column(nullable = false) private String policyVersion = "guardian-v1";
    @Column(nullable = false, columnDefinition = "boolean default false") private boolean accessPaused = false;
    @Column(nullable = false, columnDefinition = "boolean default true") private boolean postingAllowed = true;
    @Column(nullable = false, columnDefinition = "boolean default true") private boolean eventsAllowed = true;
    @Column(nullable = false, columnDefinition = "boolean default true") private boolean applicationsAllowed = true;
    @Version private long version;
}
