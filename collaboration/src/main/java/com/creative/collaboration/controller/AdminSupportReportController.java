
package com.creative.collaboration.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@RestController
@RequestMapping("/api/admin/support-reports")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
public class AdminSupportReportController {

    private final JdbcTemplate jdbc;

    public AdminSupportReportController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public record ReportSummary(
            long reports,
            long pendingReports,
            long upheldReports,
            long dismissedReports
    ) {}

    public record ReportItem(
            Long id,
            String reportType,
            String description,
            String status,
            Long reporterUserId,
            String reporterUsername,
            Long reportedUserId,
            String reportedUsername,
            Long assignedAdminId,
            String assignedAdminUsername,
            String resolutionNote,
            Long resolvedBy,
            LocalDateTime createdAt,
            LocalDateTime resolvedAt
    ) {}

    public record AssignRequest(
            @NotNull Long adminId
    ) {}

    public record DecisionRequest(
            @NotBlank String decision,
            @NotBlank @Size(min = 5, max = 2000)
            String note
    ) {}

    private boolean isSuperAdmin(Authentication auth) {
        return auth != null &&
                auth.getAuthorities().stream().anyMatch(
                        a -> Set.of(
                                "ROLE_SUPER_ADMIN",
                                "SUPER_ADMIN"
                        ).contains(a.getAuthority())
                );
    }

    private Long currentUserId(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Authentication required"
            );
        }

        // Matches the existing email-based JWT subject.
        List<Long> ids = jdbc.query(
                "SELECT id FROM users WHERE email = ?",
                (rs, index) -> rs.getLong("id"),
                auth.getName()
        );

        if (ids.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Please sign in again"
            );
        }

        return ids.get(0);
    }

    private void requireSuperAdmin(Authentication auth) {
        if (!isSuperAdmin(auth)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "SuperAdmin access required"
            );
        }
    }

    private ReportItem mapReport(
            ResultSet rs,
            int row
    ) throws SQLException {

        var created = rs.getTimestamp("created_at");
        var resolved = rs.getTimestamp("resolved_at");

        return new ReportItem(
                rs.getLong("id"),
                rs.getString("report_type"),
                rs.getString("description"),
                rs.getString("status"),
                rs.getLong("reporter_user_id"),
                rs.getString("reporter_username"),
                rs.getObject("reported_user_id", Long.class),
                rs.getString("reported_username"),
                rs.getObject("assigned_admin_id", Long.class),
                rs.getString("assigned_admin_username"),
                rs.getString("resolution_note"),
                rs.getObject("resolved_by", Long.class),
                created == null ? null : created.toLocalDateTime(),
                resolved == null ? null : resolved.toLocalDateTime()
        );
    }

    private List<ReportItem> findReports(
            String where,
            Object... parameters
    ) {
        String sql = """
                SELECT
                    r.id,
                    r.report_type,
                    r.description,
                    r.status,
                    r.reporter_user_id,
                    reporter.username AS reporter_username,
                    r.reported_user_id,
                    target.username AS reported_username,
                    r.assigned_admin_id,
                    assigned.username AS assigned_admin_username,
                    r.resolution_note,
                    r.resolved_by,
                    r.created_at,
                    r.resolved_at
                FROM app_support_reports r
                JOIN users reporter
                    ON reporter.id = r.reporter_user_id
                LEFT JOIN users target
                    ON target.id = r.reported_user_id
                LEFT JOIN users assigned
                    ON assigned.id = r.assigned_admin_id
                WHERE
                """ + where + """
                
                ORDER BY r.created_at DESC, r.id DESC
                LIMIT 200
                """;

        return jdbc.query(
                sql,
                this::mapReport,
                parameters
        );
    }

    private ReportItem findOne(Long id) {
        List<ReportItem> reports = findReports("r.id = ?", id);

        if (reports.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Report not found"
            );
        }

        return reports.get(0);
    }

    // =======================================
    // COUNTS FOR EXISTING DASHBOARD CARDS
    // =======================================

    @GetMapping("/summary")
    public ReportSummary summary(Authentication auth) {

        String filter = isSuperAdmin(auth)
                ? ""
                : " WHERE assigned_admin_id = ?";

        Object[] params = isSuperAdmin(auth)
                ? new Object[] {}
                : new Object[] {currentUserId(auth)};

        String sql = """
                SELECT
                    COUNT(*) AS total,
                    COALESCE(SUM(
                        CASE WHEN status = 'PENDING'
                             THEN 1 ELSE 0 END
                    ), 0) AS pending,
                    COALESCE(SUM(
                        CASE WHEN status = 'UPHELD'
                             THEN 1 ELSE 0 END
                    ), 0) AS upheld,
                    COALESCE(SUM(
                        CASE WHEN status = 'DISMISSED'
                             THEN 1 ELSE 0 END
                    ), 0) AS dismissed
                FROM app_support_reports
                """ + filter;

        return jdbc.queryForObject(
                sql,
                (rs, row) -> new ReportSummary(
                        rs.getLong("total"),
                        rs.getLong("pending"),
                        rs.getLong("upheld"),
                        rs.getLong("dismissed")
                ),
                params
        );
    }

    // =======================================
    // ALL REPORTS: SUPERADMIN ONLY
    // =======================================

    @GetMapping
    public List<ReportItem> allReports(Authentication auth) {
        requireSuperAdmin(auth);
        return findReports("1 = 1");
    }

    // =======================================
    // ADMIN'S ASSIGNED REPORTS
    // =======================================

    @GetMapping("/assigned")
    public List<ReportItem> assigned(Authentication auth) {
        return findReports(
                "r.assigned_admin_id = ?",
                currentUserId(auth)
        );
    }

    // =======================================
    // SUPERADMIN ASSIGNS A REPORT
    // =======================================

    @PatchMapping("/{id}/assign")
    @Transactional
    public ReportItem assign(
            @PathVariable Long id,
            @Valid @RequestBody AssignRequest request,
            Authentication auth
    ) {
        requireSuperAdmin(auth);

        Integer validAdmin = jdbc.queryForObject(
                """
                SELECT COUNT(*)
                FROM users
                WHERE id = ?
                  AND role = 'ADMIN'
                """,
                Integer.class,
                request.adminId()
        );

        if (validAdmin == null || validAdmin == 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Selected user is not an Admin"
            );
        }

        int updated = jdbc.update(
                """
                UPDATE app_support_reports
                SET assigned_admin_id = ?
                WHERE id = ?
                  AND status = 'PENDING'
                """,
                request.adminId(),
                id
        );

        if (updated == 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Report not found or no longer pending"
            );
        }

        return findOne(id);
    }

    // =======================================
    // UPHOLD OR DISMISS REPORT
    // =======================================

    @PatchMapping("/{id}/resolve")
    @Transactional
    public ReportItem resolve(
            @PathVariable Long id,
            @Valid @RequestBody DecisionRequest request,
            Authentication auth
    ) {
        String decision = request.decision()
                .trim()
                .toUpperCase(Locale.ROOT);

        if (!Set.of("UPHELD", "DISMISSED").contains(decision)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Decision must be UPHELD or DISMISSED"
            );
        }

        Long actorId = currentUserId(auth);

        int updated;

        if (isSuperAdmin(auth)) {
            updated = jdbc.update(
                    """
                    UPDATE app_support_reports
                    SET status = ?,
                        resolution_note = ?,
                        resolved_by = ?,
                        resolved_at = CURRENT_TIMESTAMP(6)
                    WHERE id = ?
                      AND status = 'PENDING'
                    """,
                    decision,
                    request.note().trim(),
                    actorId,
                    id
            );
        } else {
            updated = jdbc.update(
                    """
                    UPDATE app_support_reports
                    SET status = ?,
                        resolution_note = ?,
                        resolved_by = ?,
                        resolved_at = CURRENT_TIMESTAMP(6)
                    WHERE id = ?
                      AND status = 'PENDING'
                      AND assigned_admin_id = ?
                    """,
                    decision,
                    request.note().trim(),
                    actorId,
                    id,
                    actorId
            );
        }

        if (updated == 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Report already handled or not assigned to you"
            );
        }

        return findOne(id);
    }
}
