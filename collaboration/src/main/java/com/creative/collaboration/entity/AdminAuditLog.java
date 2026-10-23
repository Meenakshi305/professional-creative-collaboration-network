package com.creative.collaboration.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name="admin_audit_logs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AdminAuditLog {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  @Column(nullable=false) private Long actorId;
  @Column(nullable=false, length=60) private String action;
  @Column(nullable=false, length=40) private String targetType;
  private Long targetId;
  @Column(length=1000) private String details;
  @Column(nullable=false, updatable=false) private LocalDateTime createdAt;
  @PrePersist void beforeInsert(){ if(createdAt==null) createdAt=LocalDateTime.now(); }
}
