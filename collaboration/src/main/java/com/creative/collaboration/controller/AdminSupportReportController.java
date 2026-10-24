
package com.creative.collaboration.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
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
            String resolutionNote,
            Long resolvedBy,
            LocalDateTime createdAt,
            LocalDateTime resolvedAt
    ) {}

    public record DecisionRequest(
            @NotBlank String decision,
            @NotBlank @Size(min = 10, max = 2000)
            String note
    ) {}

    // ==========================================
    // AUTHENTICATED ADMIN / SUPERADMIN
    // ==========================================

    private Long currentAdminId(Authentication auth) {

        if (auth == null || !auth.isAuthenticated()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Authentication required"
            );
        }

        List<Long> ids = jdbc.query(
                """
                SELECT id FROM users
                WHERE email = ?
                  AND role IN ('ADMIN', 'SUPER_ADMIN')
                  AND active = TRUE
                """,
                (rs, row) -> rs.getLong("id"),
                auth.getName()
        );

        if (ids.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Active administrator account required"
            );
        }

        return ids.get(0);
    }

    // ==========================================
    // DATABASE ROW MAPPING
    // ==========================================

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
                rs.getString("resolution_note"),
                rs.getObject("resolved_by", Long.class),
                created == null ? null : created.toLocalDateTime(),
                resolved == null ? null : resolved.toLocalDateTime()
        );
    }

    private static final String REPORT_SQL = """
            SELECT
                r.id,
                r.report_type,
                r.description,
                r.status,
                r.reporter_user_id,
                reporter.username AS reporter_username,
                r.reported_user_id,
                target.username AS reported_username,
                r.resolution_note,
                r.resolved_by,
                r.created_at,
                r.resolved_at
            FROM app_support_reports r
            JOIN users reporter
                ON reporter.id = r.reporter_user_id
            LEFT JOIN users target
                ON target.id = r.reported_user_id
            """;

    private List<ReportItem> findReports(
            String condition,
            Object... parameters
    ) {

        return jdbc.query(
                REPORT_SQL +
                        " WHERE " + condition +
                        " ORDER BY r.created_at DESC, r.id DESC LIMIT 200",
                this::mapReport,
                parameters
        );
    }

    private ReportItem findOne(Long id) {

        List<ReportItem> matches =
                findReports("r.id = ?", id);

        if (matches.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Report not found"
            );
        }

        return matches.get(0);
    }

    // ==========================================
    // 1. SHARED REPORT SUMMARY
    // ==========================================

    @GetMapping("/summary")
    public ReportSummary summary(Authentication auth) {

        currentAdminId(auth);

        return jdbc.queryForObject(
                """
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
                """,
                (rs, row) -> new ReportSummary(
                        rs.getLong("total"),
                        rs.getLong("pending"),
                        rs.getLong("upheld"),
                        rs.getLong("dismissed")
                )
        );
    }

    // ==========================================
    // 2. ALL SETTINGS REPORTS
    // ==========================================

    @GetMapping
    public List<ReportItem> allReports(
            @RequestParam(defaultValue = "ALL")
            String status,
            Authentication auth
    ) {

        currentAdminId(auth);

        String normalized = status.trim()
                .toUpperCase(Locale.ROOT);

        if ("ALL".equals(normalized)) {
            return findReports("1 = 1");
        }

        if (!Set.of(
                "PENDING",
                "UPHELD",
                "DISMISSED"
        ).contains(normalized)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid status"
            );
        }

        return findReports(
                "r.status = ?",
                normalized
        );
    }

    // ==========================================
    // 3. RESOLVE WITHOUT ASSIGNMENT
    // ==========================================

    @PatchMapping("/{id}/resolve")
    @Transactional
    public ReportItem resolve(
            @PathVariable Long id,
            @Valid @RequestBody DecisionRequest request,
            Authentication auth
    ) {

        Long adminId = currentAdminId(auth);

        String decision = request.decision()
                .trim()
                .toUpperCase(Locale.ROOT);

        if (!Set.of("UPHELD", "DISMISSED")
                .contains(decision)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Decision must be UPHELD or DISMISSED"
            );
        }

        int updated = jdbc.update(
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
                adminId,
                id
        );

        if (updated == 0) {
            Integer count = jdbc.queryForObject(
                    """
                    SELECT COUNT(*)
                    FROM app_support_reports
                    WHERE id = ?
                    """,
                    Integer.class,
                    id
            );

            if (count == null || count == 0) {
                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Report not found"
                );
            }

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Report already reviewed"
            );
        }

        return findOne(id);
    }
}
