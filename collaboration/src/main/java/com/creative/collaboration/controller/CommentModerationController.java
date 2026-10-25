
package com.creative.collaboration.controller;

import com.creative.collaboration.entity.CommentModerationReport;
import com.creative.collaboration.repository.CommentModerationReportRepository;
import com.creative.collaboration.service.CommentModerationService;
import com.creative.collaboration.service.AdminIdentityService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Locale;

@RestController
public class CommentModerationController {

    private final CommentModerationService service;
    private final CommentModerationReportRepository reports;
    private final AdminIdentityService identity;

    public CommentModerationController(
            CommentModerationService service,
            CommentModerationReportRepository reports,
            AdminIdentityService identity
    ) {
        this.service = service;
        this.reports = reports;
        this.identity = identity;
    }

    // ============================================
    // REQUEST DTOs
    // ============================================

    public record NewReport(
            @NotBlank
            @Size(min = 10, max = 1000)
            String reason
    ) {}

    public record Assign(
            @NotNull
            Long adminId
    ) {}

    public record Decision(
            @NotBlank
            String decision,

            @NotBlank
            @Size(min = 10, max = 1000)
            String note
    ) {}

    public record Remove(
            @NotBlank
            @Size(min = 10, max = 1000)
            String reason
    ) {}

    // ============================================
    // USER: REPORT A COMMENT
    // ============================================

    @PostMapping("/api/posts/{postId}/comments/{commentId}/report")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CommentModerationReport> report(
            @PathVariable Long postId,
            @PathVariable Long commentId,
            @Valid @RequestBody NewReport body,
            Authentication auth
    ) {
        CommentModerationReport result = service.submit(
                postId,
                commentId,
                body.reason(),
                auth
        );

        return ResponseEntity.ok(result);
    }

    // ============================================
    // ADMIN: LIST COMMENT REPORTS
    // ============================================

    @GetMapping("/api/admin/comment-reports")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public Page<CommentModerationReport> list(
            @RequestParam(required = false) String status,
            Pageable page
    ) {
        if (status == null || status.isBlank()) {
            return reports.findAll(page);
        }

        return reports.findByStatus(
                status.trim().toUpperCase(Locale.ROOT),
                page
        );
    }

    // ============================================
    // ADMIN: MY ASSIGNED COMMENT REPORTS
    // ============================================

    @GetMapping("/api/admin/comment-reports/assigned")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public Page<CommentModerationReport> assigned(
            Authentication auth,
            Pageable page
    ) {
        Long adminId = identity.current(auth).getId();

        return reports.findByAssignedAdminId(
                adminId,
                page
        );
    }

    // ============================================
    // ADMIN: PREVIEW REPORTED COMMENT
    // ============================================

    @GetMapping("/api/admin/comment-reports/{id}/comment")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public CommentModerationService.CommentDetail preview(
            @PathVariable Long id,
            Authentication auth
    ) {
        // The service must enforce assigned-admin scope
        // for ordinary ADMIN users.
        return service.preview(id);
    }

    // ============================================
    // ADMIN: ASSIGN COMMENT REPORT
    // ============================================

    @PatchMapping("/api/admin/comment-reports/{id}/assign")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public CommentModerationReport assign(
            @PathVariable Long id,
            @Valid @RequestBody Assign body,
            Authentication auth
    ) {
        return service.assign(
                id,
                body.adminId(),
                auth
        );
    }

    // ============================================
    // ADMIN: UPHOLD OR DISMISS REPORT
    // ============================================

    @PatchMapping("/api/admin/comment-reports/{id}/resolve")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public CommentModerationReport resolve(
            @PathVariable Long id,
            @Valid @RequestBody Decision body,
            Authentication auth
    ) {
        return service.decide(
                id,
                body.decision().trim().toUpperCase(Locale.ROOT),
                body.note(),
                auth
        );
    }

    // ============================================
    // ADMIN: REMOVE REPORTED COMMENT
    // ============================================

    @PostMapping("/api/admin/comment-reports/{id}/remove-comment")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Void> remove(
            @PathVariable Long id,
            @Valid @RequestBody Remove body,
            Authentication auth
    ) {
        service.removeReportedComment(
                id,
                body.reason(),
                auth
        );

        return ResponseEntity.noContent().build();
    }
}
