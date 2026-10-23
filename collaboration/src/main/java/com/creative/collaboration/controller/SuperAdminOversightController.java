package com.creative.collaboration.controller;

import com.creative.collaboration.entity.AdminAuditLog;
import com.creative.collaboration.entity.AdminReport;
import com.creative.collaboration.entity.User;
import com.creative.collaboration.repository.*;
import com.creative.collaboration.service.AdminAuditService;
import com.creative.collaboration.service.AdminIdentityService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.Locale;

@RestController
@RequestMapping("/api/superadmin")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class SuperAdminOversightController {
    private final UserRepository users;
    private final PostRepository posts;
    private final EventRepository events;
    private final AdminReportRepository reports;
    private final AdminAuditLogRepository logs;
    private final AdminIdentityService identity;
    private final AdminAuditService audit;

    public SuperAdminOversightController(UserRepository users, PostRepository posts,
                                        EventRepository events, AdminReportRepository reports,
                                        AdminAuditLogRepository logs, AdminIdentityService identity,
                                        AdminAuditService audit) {
        this.users=users;this.posts=posts;this.events=events;this.reports=reports;
        this.logs=logs;this.identity=identity;this.audit=audit;
    }
    public record Totals(long users, long administrators, long posts, long events,
                         long reports, long pendingReports, long upheldReports,
                         long dismissedReports) {}
    @GetMapping({"/overview","/analytics"})
    public Totals overview() {
        long admins=users.findAll().stream().filter(u -> {
            String role=u.getRole()==null?"":u.getRole().replaceFirst("(?i)^ROLE_", "").toUpperCase(Locale.ROOT);
            return role.equals("ADMIN") || role.equals("SUPER_ADMIN");
        }).count();
        return new Totals(users.count(),admins,posts.count(),events.count(),reports.count(),
                reports.countByStatus("PENDING"),reports.countByStatus("UPHELD"),
                reports.countByStatus("DISMISSED"));
    }
    @GetMapping("/reports")
    public Page<AdminReport> allReports(@RequestParam(required=false) String status, Pageable pageable) {
        return status==null || status.isBlank() ? reports.findAll(pageable)
                : reports.findByStatus(status.trim().toUpperCase(Locale.ROOT),pageable);
    }
    public record AssignReport(@NotNull Long adminId) {}
    @PatchMapping("/reports/{id}/assign")
    @Transactional
    public AdminReport assign(@PathVariable Long id, @Valid @RequestBody AssignReport body,
                              Authentication authentication) {
        User actor=identity.current(authentication);
        User admin=users.findById(body.adminId()).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND,"Assignee not found"));
        String role=admin.getRole()==null?"":admin.getRole().replaceFirst("(?i)^ROLE_", "").toUpperCase(Locale.ROOT);
        if(!admin.isActive() || !(role.equals("ADMIN") || role.equals("SUPER_ADMIN")))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Assignee must be active administrator");
        AdminReport report=reports.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND,"Report not found"));
        if(!"PENDING".equals(report.getStatus()))
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Report has already been resolved");
        report.setAssignedAdminId(admin.getId());
        audit.record(actor.getId(),"ASSIGN_REPORT","REPORT",id,"Assigned to "+admin.getId());
        return reports.save(report);
    }
    @GetMapping("/audit")
    public Page<AdminAuditLog> auditLog(Pageable pageable) { return logs.findAll(pageable); }
    @GetMapping("/audit/admin/{adminId}")
    public Page<AdminAuditLog> adminAudit(@PathVariable Long adminId, Pageable pageable) {
        return logs.findByActorId(adminId,pageable);
    }
    @GetMapping("/system/health")
    public java.util.Map<String,Object> health() {
        long userCount = users.count(); // Executes a database query; failure returns an error.
        return java.util.Map.of("status","RUNNING","database","REACHABLE",
                "userCount",userCount,"serverTime",java.time.OffsetDateTime.now().toString());
    }
}
