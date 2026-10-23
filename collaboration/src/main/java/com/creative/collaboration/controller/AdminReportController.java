package com.creative.collaboration.controller;

import com.creative.collaboration.entity.AdminReport;
import com.creative.collaboration.entity.User;
import com.creative.collaboration.repository.*;
import com.creative.collaboration.service.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDateTime;
import static org.springframework.http.HttpStatus.*;

@RestController
@RequestMapping("/api/admin/reports")
@PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
public class AdminReportController {
  private final AdminReportRepository reports;
  private final UserRepository users;
  private final AdminIdentityService identity;
  private final AdminAuditService audit;
  public AdminReportController(AdminReportRepository reports, UserRepository users,
      AdminIdentityService identity, AdminAuditService audit){
    this.reports=reports;this.users=users;this.identity=identity;this.audit=audit;
  }
  public record AssignRequest(@NotNull Long adminId) {}
  public record ResolveRequest(@NotBlank String decision, @Size(max=1000) String note) {}
  @GetMapping public Page<AdminReport> list(@RequestParam(required=false) String status, Pageable page){
    return status==null?reports.findAll(page):reports.findByStatus(status.toUpperCase(),page);
  }
  @GetMapping("/assigned") public Page<AdminReport> assigned(Authentication auth,Pageable page){
    return reports.findByAssignedAdminId(identity.current(auth).getId(),page);
  }
  @PatchMapping("/{id}/assign") @Transactional
  public AdminReport assign(@PathVariable Long id,@Valid @RequestBody AssignRequest body,Authentication auth){
    User actor=identity.current(auth);
    User target=users.findById(body.adminId()).orElseThrow(()->new ResponseStatusException(NOT_FOUND,"Admin not found"));
    String role=target.getRole()==null?"":target.getRole().replaceFirst("^ROLE_","");
    if(!target.isActive()||!("ADMIN".equals(role)||"SUPER_ADMIN".equals(role)))
      throw new ResponseStatusException(BAD_REQUEST,"Assignee must be active Admin");
    AdminReport report=reports.findById(id).orElseThrow(()->new ResponseStatusException(NOT_FOUND,"Report not found"));
    if(!"PENDING".equals(report.getStatus())) throw new ResponseStatusException(CONFLICT,"Report already resolved");
    report.setAssignedAdminId(target.getId());
    audit.record(actor.getId(),"ASSIGN_REPORT","REPORT",id,"Assigned to admin ID " + target.getId());
    return reports.save(report);
  }
  @PatchMapping("/{id}/resolve") @Transactional
  public AdminReport resolve(@PathVariable Long id,@Valid @RequestBody ResolveRequest body,Authentication auth){
    User actor=identity.current(auth);
    AdminReport report=reports.findById(id).orElseThrow(()->new ResponseStatusException(NOT_FOUND,"Report not found"));
    if(!"PENDING".equals(report.getStatus())) throw new ResponseStatusException(CONFLICT,"Report already resolved");
    if(report.getAssignedAdminId()!=null && !report.getAssignedAdminId().equals(actor.getId())
        && !identity.isSuperAdmin(auth)) throw new ResponseStatusException(FORBIDDEN,"Assigned to another admin");
    String decision=body.decision().toUpperCase();
    if(!decision.equals("DISMISSED") && !decision.equals("UPHELD"))
      throw new ResponseStatusException(BAD_REQUEST,"Decision must be DISMISSED or UPHELD");
    report.setStatus(decision);
    report.setResolutionNote(body.note());
    report.setResolvedById(actor.getId());
    report.setResolvedAt(LocalDateTime.now());
    audit.record(actor.getId(),"RESOLVE_REPORT","REPORT",id,decision);
    return reports.save(report);
  }
}
