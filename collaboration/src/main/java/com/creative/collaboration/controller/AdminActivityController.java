package com.creative.collaboration.controller;

import com.creative.collaboration.entity.AdminAuditLog;
import com.creative.collaboration.repository.AdminAuditLogRepository;
import com.creative.collaboration.service.AdminIdentityService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/activity")
@PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
public class AdminActivityController {
  private final AdminAuditLogRepository logs;
  private final AdminIdentityService identity;
  public AdminActivityController(AdminAuditLogRepository logs,AdminIdentityService identity){this.logs=logs;this.identity=identity;}
  @GetMapping public Page<AdminAuditLog> own(Authentication auth, Pageable page){
    return logs.findByActorId(identity.current(auth).getId(),page);
  }
}
