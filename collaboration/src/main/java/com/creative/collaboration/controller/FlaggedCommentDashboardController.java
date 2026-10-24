
package com.creative.collaboration.controller;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@RestController
@RequestMapping("/api/admin/flagged-comments/dashboard")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
public class FlaggedCommentDashboardController {

    private final JdbcTemplate jdbc;

    public FlaggedCommentDashboardController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public record FlagRow(
            Long id,
            Long commentId,
            Long postId,
            Long commentUserId,
            String username,
            String commentText,
            String matchedWords,
            String status,
            long confirmedViolations,
            boolean accountActive,
            boolean thresholdReached,
            LocalDateTime detectedAt,
            String reviewNote
    ) {}

    public record Summary(
            long pendingReview,
            long confirmedViolations,
            long deactivatedOffenders
    ) {}

    public record DashboardResponse(
            Summary summary,
            List<FlagRow> content
    ) {}

    @GetMapping
    public DashboardResponse dashboard(
            @RequestParam(defaultValue = "ALL") String status
    ) {
        String normalized = status.trim().toUpperCase(Locale.ROOT);

        if (!Set.of("ALL", "PENDING", "UPHELD", "DISMISSED")
                .contains(normalized)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid report status"
            );
        }

        List<FlagRow> rows = jdbc.query(
                """
                SELECT
                    f.id,
                    f.comment_id,
                    f.post_id,
                    f.comment_user_id,
                    u.username,
                    f.comment_text,
                    f.matched_words,
                    f.status,
                    f.detected_at,
                    f.review_note,
                    COALESCE(v.violation_count, 0)
                        AS confirmed_violations,
                    u.active AS account_active
                FROM flagged_comments f
                JOIN users u
                    ON u.id = f.comment_user_id
                LEFT JOIN (
                    SELECT
                        comment_user_id,
                        COUNT(*) AS violation_count
                    FROM flagged_comments
                    WHERE status = 'UPHELD'
                    GROUP BY comment_user_id
                ) v ON v.comment_user_id = f.comment_user_id
                WHERE (? = 'ALL' OR f.status = ?)
                ORDER BY f.detected_at DESC, f.id DESC
                LIMIT 200
                """,
                (rs, index) -> {
                    Timestamp detected =
                            rs.getTimestamp("detected_at");

                    long violations =
                            rs.getLong("confirmed_violations");

                    return new FlagRow(
                            rs.getLong("id"),
                            rs.getLong("comment_id"),
                            rs.getLong("post_id"),
                            rs.getLong("comment_user_id"),
                            rs.getString("username"),
                            rs.getString("comment_text"),
                            rs.getString("matched_words"),
                            rs.getString("status"),
                            violations,
                            rs.getBoolean("account_active"),
                            violations >= 6,
                            detected == null
                                    ? null
                                    : detected.toLocalDateTime(),
                            rs.getString("review_note")
                    );
                },
                normalized,
                normalized
        );

        Summary summary = jdbc.queryForObject(
                """
                SELECT
                    (SELECT COUNT(*)
                     FROM flagged_comments
                     WHERE status = 'PENDING') AS pending,
                    (SELECT COUNT(*)
                     FROM flagged_comments
                     WHERE status = 'UPHELD') AS upheld,
                    (SELECT COUNT(*)
                     FROM users u
                     WHERE u.role = 'USER'
                       AND u.active = FALSE
                       AND (
                           SELECT COUNT(*)
                           FROM flagged_comments f
                           WHERE f.comment_user_id = u.id
                             AND f.status = 'UPHELD'
                       ) >= 6) AS deactivated
                """,
                (rs, index) -> new Summary(
                        rs.getLong("pending"),
                        rs.getLong("upheld"),
                        rs.getLong("deactivated")
                )
        );

        return new DashboardResponse(summary, rows);
    }
}
