package com.creative.collaboration.service;

import com.creative.collaboration.entity.AdminAuditLog;
import com.creative.collaboration.repository.AdminAuditLogRepository;
import org.springframework.stereotype.Service;

@Service
public class AdminAuditService {
  private final AdminAuditLogRepository repo;
  public AdminAuditService(AdminAuditLogRepository repo){this.repo=repo;}
  public void record(Long actor, String action, String targetType, Long targetId, String details){
    repo.save(AdminAuditLog.builder().actorId(actor).action(action)
      .targetType(targetType).targetId(targetId).details(details).build());
  }
}
