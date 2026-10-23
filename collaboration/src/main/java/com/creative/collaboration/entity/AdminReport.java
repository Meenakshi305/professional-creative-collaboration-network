package com.creative.collaboration.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "admin_reports", indexes = {
  @Index(name = "idx_admin_report_status", columnList = "status"),
  @Index(name = "idx_admin_report_assignee", columnList = "assigned_admin_id")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AdminReport {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  @Column(name = "reported_post_id", nullable = false)
  private Long reportedPostId;
  @Column(name = "reporter_id", nullable = false)
  private Long reporterId;
  @Column(nullable = false, length = 1000)
  private String reason;
  @Column(nullable = false, length = 30)
  @Builder.Default private String status = "PENDING";
  @Column(name = "assigned_admin_id")
  private Long assignedAdminId;
  @Column(name = "resolved_by_id")
  private Long resolvedById;
  @Column(length = 1000)
  private String resolutionNote;
  @Column(nullable = false, updatable = false)
  private LocalDateTime createdAt;
  private LocalDateTime resolvedAt;
  @PrePersist void beforeInsert() {
    if (createdAt == null) createdAt = LocalDateTime.now();
    if (status == null) status = "PENDING";
  }
}
