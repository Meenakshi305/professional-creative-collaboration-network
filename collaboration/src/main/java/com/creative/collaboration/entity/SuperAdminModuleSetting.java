package com.creative.collaboration.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name="superadmin_module_settings")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SuperAdminModuleSetting {
    @Id @Column(name="module_key",length=64)
    private String moduleKey;
    @Column(nullable=false)
    private boolean enabled;
    private Long changedById;
    private LocalDateTime changedAt;
    @PrePersist @PreUpdate void timestamp(){ changedAt=LocalDateTime.now(); }
}
